#!/usr/bin/env python3
"""
Docx Pipeline Sidecar — main entry point.
JSON stdin → JSON stdout protocol.
"""

from __future__ import annotations

import json
import subprocess
import sys
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

    # Try to detect LibreOffice
    try:
        result = subprocess.run(
            ["soffice", "--version"],
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
        python_accessible=True,
        libreoffice_accessible=libreoffice_accessible,
    )

    return {
        "status": "success",
        "result": {
            "python_version": python_version,
            "libreoffice_version": libreoffice_version,
            "python_accessible": True,
            "libreoffice_accessible": libreoffice_accessible,
        },
    }


def handle_extract_vars(params: dict[str, Any]) -> dict[str, Any]:
    """Extract variables from a docx template. Not yet implemented."""
    return {"status": "error", "code": 1, "message": "Not implemented in Phase 15"}


def handle_render(params: dict[str, Any]) -> dict[str, Any]:
    """Render a docx template with variables. Not yet implemented."""
    return {"status": "error", "code": 1, "message": "Not implemented in Phase 15"}


def handle_convert(params: dict[str, Any]) -> dict[str, Any]:
    """Convert a docx to PDF via LibreOffice. Not yet implemented."""
    return {"status": "error", "code": 1, "message": "Not implemented in Phase 15"}


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