"""OCR service.

Workflow for a PDF notice:
    1. Try to extract a text layer directly with PyMuPDF.
    2. If there is meaningful text, return it.
    3. Otherwise render pages to images and run Tesseract OCR.
    4. Clean the extracted text.

Failures are handled gracefully: the service returns (text, ok, error)
instead of raising, so callers can store partial results.
"""

import io
import re
from typing import List, Tuple

from PIL import Image
from pytesseract import image_to_string, pytesseract

from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger("ocr_service")

ALLOWED_IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp")


def _configure_tesseract() -> None:
    if settings.TESSERACT_CMD:
        pytesseract.tesseract_cmd = settings.TESSERACT_CMD


def _clean_text(text: str) -> str:
    text = text.replace("\x00", "")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    text = re.sub(r"[ \t]+\n", "\n", text)
    return text.strip()


def _has_text_layer(pdf: "fitz.Document") -> bool:
    total_chars = 0
    for page in pdf:
        total_chars += len(page.get_text("text") or "")
        if total_chars > 50:
            return True
    return False


def _extract_text_layer(pdf: "fitz.Document") -> str:
    parts: List[str] = []
    for page in pdf:
        text = page.get_text("text") or ""
        if text.strip():
            parts.append(text)
    return "\n".join(parts)


def _ocr_images(images: List[Image.Image], lang: str = "eng") -> str:
    parts: List[str] = []
    for image in images:
        try:
            parts.append(image_to_string(image, lang=lang))
        except Exception as exc:  # noqa: BLE001 - tesseract not installed etc.
            logger.warning("OCR failed on an image", extra={"error": str(exc)})
    return "\n".join(parts)


def extract_text_from_pdf(data: bytes) -> Tuple[str, bool, str]:
    """Extract text from a PDF. Returns (text, ok, error)."""
    try:
        import fitz  # PyMuPDF
    except ImportError:
        return "", False, "PyMuPDF is not installed."

    _configure_tesseract()
    try:
        with fitz.open(stream=data, filetype="pdf") as pdf:
            if _has_text_layer(pdf):
                text = _extract_text_layer(pdf)
                return _clean_text(text), True, ""
            images = []
            for page in pdf:
                pix = page.get_pixmap(dpi=200)
                images.append(Image.open(io.BytesIO(pix.tobytes("png"))))
            if not images:
                return "", False, "PDF has no pages."
            text = _ocr_images(images)
            if not text.strip():
                return "", False, "OCR could not read any text from the PDF."
            return _clean_text(text), True, ""
    except Exception as exc:  # noqa: BLE001
        logger.error("PDF extraction failed", extra={"error": str(exc)})
        return "", False, f"PDF processing failed: {exc}"


def extract_text_from_image(data: bytes, extension: str) -> Tuple[str, bool, str]:
    """Extract text from an image file via Tesseract."""
    _configure_tesseract()
    try:
        image = Image.open(io.BytesIO(data))
        text = image_to_string(image)
        if not text.strip():
            return "", False, "OCR could not read any text from the image."
        return _clean_text(text), True, ""
    except Exception as exc:  # noqa: BLE001
        logger.error("Image OCR failed", extra={"error": str(exc)})
        return "", False, f"OCR failed: {exc}"


def extract_text(data: bytes, filename: str) -> Tuple[str, bool, str]:
    """Dispatch to the right extractor based on file extension."""
    lower = filename.lower()
    if lower.endswith(".pdf"):
        return extract_text_from_pdf(data)
    if lower.endswith(ALLOWED_IMAGE_EXTENSIONS):
        return extract_text_from_image(data, lower.rsplit(".", 1)[-1])
    return "", False, "Unsupported file type for OCR (expected PDF or image)."
