"""Parse uploaded CSV/XLSX files into a list of row dicts."""

from io import BytesIO
from typing import Any, Dict, List

import pandas as pd

from app.core.exceptions import ValidationFailedError


def read_table(file_bytes: bytes, filename: str) -> List[Dict[str, Any]]:
    """Read CSV or XLSX bytes into a list of dicts (one per data row).

    Column names are normalised: stripped and lowercased.
    """
    name = filename.lower()
    try:
        if name.endswith(".csv"):
            df = pd.read_csv(BytesIO(file_bytes))
        elif name.endswith(".xlsx") or name.endswith(".xls"):
            df = pd.read_excel(BytesIO(file_bytes))
        else:
            raise ValidationFailedError(
                "Unsupported file format. Upload a CSV or XLSX file.",
                code="UNSUPPORTED_FILE_TYPE",
            )
    except ValidationFailedError:
        raise
    except Exception as exc:  # pragma: no cover - depends on pandas internals
        raise ValidationFailedError("Could not parse the file. Check its structure.") from exc

    if df.empty:
        return []

    df.columns = [str(c).strip().lower() for c in df.columns]
    # Keep fully empty rows out.
    df = df.dropna(how="all")
    rows: List[Dict[str, Any]] = []
    for record in df.to_dict(orient="records"):
        cleaned = {str(k).strip().lower(): (None if pd.isna(v) else v) for k, v in record.items()}
        rows.append(cleaned)
    return rows


def sanitize_filename(filename: str) -> str:
    """Strip path components and unsafe characters from a filename."""
    import re

    base = filename.replace("\\", "/").split("/")[-1]
    base = re.sub(r"[^A-Za-z0-9._-]+", "_", base)
    return base or "file"


def save_upload(file_bytes: bytes, filename: str, upload_dir: str) -> Dict[str, str]:
    """Persist an uploaded file under upload_dir and return its public URL info.

    Returns a dict with `filename` (sanitised), `file_path` and `file_url`.
    """
    import uuid

    from pathlib import Path

    from app.core.logging import get_logger

    logger = get_logger("files")

    safe = sanitize_filename(filename)
    unique = f"{uuid.uuid4().hex[:12]}_{safe}"
    directory = Path(upload_dir)
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / unique
    try:
        path.write_bytes(file_bytes)
    except OSError as exc:  # pragma: no cover - OS dependent
        raise ValidationFailedError("Could not save the uploaded file.") from exc

    url = f"/uploads/{unique}"
    logger.info("Saved upload", extra={"file": unique})
    return {"filename": safe, "file_path": str(path), "file_url": url}
