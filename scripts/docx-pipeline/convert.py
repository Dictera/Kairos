"""LibreOffice DOCX→PDF converter with tenacity retry."""

from __future__ import annotations

import os
import shutil
import subprocess
import tempfile
import uuid

from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)


class LibreOfficeError(Exception):
    """Raised when LibreOffice conversion fails."""

    pass


@retry(
    reraise=True,
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10),
    retry=retry_if_exception_type((subprocess.TimeoutExpired, LibreOfficeError)),
)
def convert_with_libreoffice(
    input_path: str,
    output_dir: str,
    libreoffice_path: str,
    timeout: int = 120,
) -> str:
    """Convert a DOCX file to PDF using LibreOffice headless.

    Args:
        input_path: Path to the input .docx file.
        output_dir: Directory where the output .pdf will be written.
        libreoffice_path: Path to the soffice binary.
        timeout: Maximum seconds to wait for one soffice invocation.

    Returns:
        Absolute path to the generated PDF file.

    Raises:
        LibreOfficeError: If LibreOffice returns non-zero or PDF is not created.
        subprocess.TimeoutExpired: If all retry attempts time out.
    """
    lo_profile = tempfile.mkdtemp(prefix=f"lo-{uuid.uuid4().hex}")
    try:
        cmd = [
            libreoffice_path,
            f"-env:UserInstallation=file:///{lo_profile.replace(chr(92), '/')}",
            "--headless",
            "--convert-to",
            "pdf",
            "--outdir",
            output_dir,
            input_path,
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
        )

        if result.returncode != 0:
            raise LibreOfficeError(
                f"LibreOffice convert failed: {result.stderr}"
            )

        expected_pdf = os.path.join(
            output_dir,
            os.path.splitext(os.path.basename(input_path))[0] + ".pdf",
        )

        if not os.path.exists(expected_pdf):
            raise LibreOfficeError("PDF output not created")

        return expected_pdf
    finally:
        shutil.rmtree(lo_profile, ignore_errors=True)
