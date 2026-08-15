"""Validation helpers shared by the bulk-import pipeline."""

from typing import Any, Callable, Dict, List, Optional

from app.schemas.bulk_upload import ImportErrorRow


def require_columns(row_columns: List[str], required: List[str], import_type: str) -> Optional[ImportErrorRow]:
    missing = [c for c in required if c not in row_columns]
    if missing:
        return ImportErrorRow(
            row=0,
            field=", ".join(missing),
            message=f"Missing required column(s): {', '.join(missing)}",
        )
    return None


def parse_int(value: Any, field: str, row: int) -> tuple[Optional[int], Optional[ImportErrorRow]]:
    if value is None or value == "":
        return None, ImportErrorRow(row=row, field=field, message="Value is required.", value="")
    try:
        return int(float(str(value).strip())), None
    except (ValueError, TypeError):
        return None, ImportErrorRow(row=row, field=field, message="Must be an integer.", value=str(value))


def parse_float(value: Any, field: str, row: int) -> tuple[Optional[float], Optional[ImportErrorRow]]:
    if value is None or value == "":
        return None, ImportErrorRow(row=row, field=field, message="Value is required.", value="")
    try:
        return float(str(value).strip()), None
    except (ValueError, TypeError):
        return None, ImportErrorRow(row=row, field=field, message="Must be a number.", value=str(value))


def parse_str(value: Any, field: str, row: int, required: bool = True) -> tuple[Optional[str], Optional[ImportErrorRow]]:
    if value is None or str(value).strip() == "":
        if required:
            return None, ImportErrorRow(row=row, field=field, message="Value is required.", value="")
        return None, None
    return str(value).strip(), None


def parse_date(value: Any, field: str, row: int) -> tuple[Optional[object], Optional[ImportErrorRow]]:
    from datetime import date

    if value is None or str(value).strip() == "":
        return None, ImportErrorRow(row=row, field=field, message="Value is required.", value="")
    try:
        if isinstance(value, date):
            return value, None
        return date.fromisoformat(str(value).strip()), None
    except ValueError:
        return None, ImportErrorRow(row=row, field=field, message="Must be a date (YYYY-MM-DD).", value=str(value))


def parse_time(value: Any, field: str, row: int) -> tuple[Optional[object], Optional[ImportErrorRow]]:
    from datetime import datetime, time

    if value is None or str(value).strip() == "":
        return None, ImportErrorRow(row=row, field=field, message="Value is required.", value="")
    try:
        if isinstance(value, time):
            return value, None
        text = str(value).strip()
        for fmt in ("%H:%M", "%H:%M:%S", "%I:%M %p"):
            try:
                return datetime.strptime(text, fmt).time(), None
            except ValueError:
                continue
        raise ValueError
    except ValueError:
        return None, ImportErrorRow(row=row, field=field, message="Must be a time (HH:MM).", value=str(value))


def collect(errors: List[ImportErrorRow], row: int, field: str, message: str, value: Any = None) -> None:
    errors.append(ImportErrorRow(row=row, field=field, message=message, value=None if value is None else str(value)))


def field_choice(value: Any, allowed: List[str], field: str, row: int) -> Optional[ImportErrorRow]:
    if value not in allowed:
        return ImportErrorRow(row=row, field=field, message=f"Must be one of: {', '.join(allowed)}.", value=str(value))
    return None


def dedupe_by(rows: List[Dict[str, Any]], key_func: Callable[[Dict[str, Any]], Any]) -> List[ImportErrorRow]:
    """Detect duplicate rows by a key function."""
    seen: Dict[Any, int] = {}
    errors: List[ImportErrorRow] = []
    for i, row in enumerate(rows, start=1):
        key = key_func(row)
        if key is None:
            continue
        if key in seen:
            errors.append(ImportErrorRow(row=i, field="record", message="Duplicate record.", value=str(key)))
        else:
            seen[key] = i
    return errors
