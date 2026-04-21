#!/usr/bin/env python3
"""
Docx Pipeline Sidecar — main entry point.
JSON stdin → JSON stdout protocol.
"""

from __future__ import annotations

import io
import json
import logging
import re
import subprocess
import sys
import zipfile
from typing import Any, Literal

import structlog
from pydantic import BaseModel, Field
from slugify import slugify

# Configure structlog for JSONL stderr output
structlog.configure(
    processors=[
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.add_log_level,
        structlog.processors.JSONRenderer(),
    ],
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    context_class=dict,
    logger_factory=structlog.WriteLoggerFactory(file=sys.stderr),
    cache_logger_on_first_use=True,
)

logger = structlog.get_logger()


class CommandEnvelope(BaseModel):
    """Command envelope from Node.js stdin."""

    command: Literal["extract-vars", "render", "convert", "health-check", "slug"] = Field(
        description="Command to execute"
    )
    params: dict[str, Any] = Field(default_factory=dict, description="Command parameters")

    model_config = {"extra": "forbid"}


def handle_slug(params: dict[str, Any]) -> dict[str, Any]:
    """Generate ASCII-safe slug from text using python-slugify."""
    text = params.get("text", "")
    if not isinstance(text, str):
        return {"status": "error", "code": 1, "message": "text parametresi string olmalı."}
    # Pre-transliterate Turkish chars before slugify to ensure correct ASCII mapping.
    # python-slugify 8.0.4 can drop Turkish chars incorrectly with default settings.
    turkish_map = str.maketrans({
        'İ': 'I', 'ı': 'i', 'Ş': 'S', 'ş': 's',
        'Ç': 'C', 'ç': 'c', 'Ö': 'O', 'ö': 'o',
        'Ü': 'U', 'ü': 'u', 'Ğ': 'G', 'ğ': 'g',
    })
    text = text.translate(turkish_map)
    slug = slugify(text, allow_unicode=False)
    return {"status": "success", "result": {"slug": slug}}


def handle_health_check(params: dict[str, Any]) -> dict[str, Any]:
    """Run health check: detect Python and LibreOffice versions."""
    python_version = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"

    libreoffice_version: str | None = None
    libreoffice_accessible = False

    # Use provided libreoffice_path (from Node.js caller) or fall back to "soffice"
    libreoffice_path: str | None = params.get("libreoffice_path")
    libreoffice_cmd = libreoffice_path if libreoffice_path else "soffice"

    try:
        result = subprocess.run(
            [libreoffice_cmd, "--version"],
            capture_output=True,
            text=True,
            timeout=5,
        )
        if result.returncode == 0:
            libreoffice_version = result.stdout.strip()
            libreoffice_accessible = True
    except (FileNotFoundError, subprocess.TimeoutExpired):
        pass

    logger.info(
        "health-check",
        python_version=python_version,
        libreoffice_version=libreoffice_version,
        libreoffice_path=libreoffice_path,
        libreoffice_accessible=libreoffice_accessible,
    )

    return {
        "status": "success",
        "result": {
            "python_version": python_version,
            "python_accessible": True,
            "libreoffice_version": libreoffice_version,
            "libreoffice_accessible": libreoffice_accessible,
        },
    }


def handle_extract_vars(params: dict[str, Any]) -> dict[str, Any]:
    """Extract {{var}} and {%p var%} placeholders from a .docx file."""
    file_path = params.get("file_path")
    if not file_path:
        return {"status": "error", "code": 1, "message": "file_path param gerekli"}

    try:
        with open(file_path, "rb") as f:
            zip_data = f.read()
    except FileNotFoundError:
        logger.error("extract-vars-missing-file", file_path=file_path)
        return {"status": "error", "code": 2, "message": f"Dosya bulunamadi: {file_path}"}
    except OSError as e:
        logger.error("extract-vars-io-error", file_path=file_path, error=str(e))
        return {"status": "error", "code": 2, "message": f"Dosya okunamadi: {e}"}

    try:
        with zipfile.ZipFile(io.BytesIO(zip_data)) as zf:
            if "word/document.xml" not in zf.namelist():
                return {"status": "error", "code": 1, "message": "Geçersiz .docx dosyası"}
            xml_content = zf.read("word/document.xml").decode("utf-8")
    except zipfile.BadZipFile:
        return {"status": "error", "code": 1, "message": "Geçersiz .docx dosyası"}

    try:
        # Strip XML tags + entities to recover text where placeholders live.
        # CRITICAL: this collapses Word's fragmented {{ var }} across multiple <w:t> nodes
        # back into a single matchable text stream. See RESEARCH.md Common Pitfalls #1.
        text_content = re.sub(r"<[^>]+>", " ", xml_content)
        text_content = re.sub(r"&\w+;", " ", text_content)
        text_content = re.sub(r"\s+", " ", text_content)

        def normalize_var(v: str) -> str:
            """Remove all whitespace from extracted variable name (Word fragments insert spaces across <w:t> nodes)."""
            return re.sub(r"\s+", "", v.strip())

        double_brace = re.findall(r"\{\{\s*([^}]+?)\s*\}\}", text_content)
        paragraph_tags = re.findall(r"\{%p\s+([^%]+?)%\}", text_content)

        combined = [normalize_var(v) for v in (double_brace + paragraph_tags) if v.strip()]
        # Dedupe preserving first-seen order.
        variables = list(dict.fromkeys(combined))

        logger.info("extract-vars-success", file_path=file_path, var_count=len(variables))
        return {"status": "success", "result": {"variables": variables}}
    except Exception as e:
        logger.error("extract-vars-error", file_path=file_path, error=str(e))
        return {"status": "error", "code": 2, "message": f"Değişken çıkarma hatası: {e}"}


def _sanitize_context(obj: Any) -> Any:
    """Recursively replace None with empty string for Jinja2 rendering."""
    if obj is None:
        return ""
    if isinstance(obj, dict):
        return {k: _sanitize_context(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_sanitize_context(item) for item in obj]
    return obj


def handle_render(params: dict[str, Any]) -> dict[str, Any]:
    """Render a docx template with Jinja2 variables using docxtpl."""
    template_path = params.get("template_path")
    output_path = params.get("output_path")
    context = params.get("context")

    if not template_path or not output_path or context is None:
        return {
            "status": "error",
            "code": 1,
            "message": "template_path, output_path ve context parametreleri zorunludur.",
        }

    try:
        from docxtpl import DocxTemplate
        import jinja2

        from filters import tr_currency, tarih, upper_tr, lower_tr

        jinja_env = jinja2.Environment()
        jinja_env.filters["tr_currency"] = tr_currency
        jinja_env.filters["tarih"] = tarih
        jinja_env.filters["upper_tr"] = upper_tr
        jinja_env.filters["lower_tr"] = lower_tr

        sanitized_context = _sanitize_context(context)

        doc = DocxTemplate(template_path)
        doc.render(sanitized_context, jinja_env)
        doc.save(output_path)

        return {"status": "success", "result": {"output_path": output_path}}
    except Exception as e:
        logger.error("render-error", error=str(e))
        return {
            "status": "error",
            "code": 2,
            "message": f"Şablon doldurma hatası: {e}",
        }


def handle_convert(params: dict[str, Any]) -> dict[str, Any]:
    """Convert a rendered DOCX to PDF via LibreOffice headless."""
    input_path = params.get("input_path")
    output_dir = params.get("output_dir")
    libreoffice_path = params.get("libreoffice_path")
    timeout = params.get("timeout", 120)

    if not input_path or not output_dir or not libreoffice_path:
        return {
            "status": "error",
            "code": 1,
            "message": "input_path, output_dir ve libreoffice_path parametreleri zorunludur.",
        }

    try:
        from convert import convert_with_libreoffice, LibreOfficeError

        pdf_path = convert_with_libreoffice(
            input_path, output_dir, libreoffice_path, timeout=timeout
        )
        return {"status": "success", "result": {"output_path": pdf_path}}
    except LibreOfficeError as e:
        return {
            "status": "error",
            "code": 3,
            "message": f"PDF dönüştürme hatası: {e}",
        }
    except subprocess.TimeoutExpired:
        return {
            "status": "error",
            "code": 3,
            "message": "LibreOffice zaman aşımına uğradı (3 deneme sonrası).",
        }
    except Exception as e:
        logger.error("convert-error", error=str(e))
        return {
            "status": "error",
            "code": 99,
            "message": f"Beklenmeyen dönüştürme hatası: {e}",
        }


def main() -> None:
    """Read JSON command from stdin, route to handler, write response to stdout."""
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            error_response = {"status": "error", "code": 99, "message": "No input received"}
            print(json.dumps(error_response), file=sys.stdout)
            sys.exit(1)

        try:
            envelope = CommandEnvelope.model_validate_json(raw_input)
        except Exception as e:
            logger.error("validation-error", error=str(e))
            error_response = {"status": "error", "code": 1, "message": f"Doğrulama hatası: {e}"}
            print(json.dumps(error_response), file=sys.stdout)
            sys.exit(1)

        handler_map = {
            "health-check": handle_health_check,
            "extract-vars": handle_extract_vars,
            "render": handle_render,
            "convert": handle_convert,
            "slug": handle_slug,
        }

        handler = handler_map.get(envelope.command)
        if not handler:
            logger.error("unknown-command", command=envelope.command)
            error_response = {"status": "error", "code": 99, "message": f"Bilinmeyen komut: {envelope.command}"}
            print(json.dumps(error_response), file=sys.stdout)
            sys.exit(99)

        result = handler(envelope.params)

        print(json.dumps(result), file=sys.stdout)
        sys.exit(0)

    except Exception as e:
        logger.error("internal-error", error=str(e), exc_info=True)
        error_response = {"status": "error", "code": 99, "message": str(e)}
        print(json.dumps(error_response), file=sys.stdout)
        sys.exit(99)


if __name__ == "__main__":
    main()