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

    command: Literal["extract-vars", "render", "convert", "health-check"] = Field(
        description="Command to execute"
    )
    params: dict[str, Any] = Field(default_factory=dict, description="Command parameters")

    model_config = {"extra": "forbid"}


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


def handle_render(params: dict[str, Any]) -> dict[str, Any]:
    """Render a docx template with variables. Not yet implemented."""
    return {"status": "error", "code": 2, "message": "Render is not yet implemented"}


def handle_convert(params: dict[str, Any]) -> dict[str, Any]:
    """Convert a docx to PDF via LibreOffice. Not yet implemented."""
    return {"status": "error", "code": 3, "message": "Convert is not yet implemented"}


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