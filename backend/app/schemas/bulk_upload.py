from typing import List, Optional

from pydantic import BaseModel


class ImportErrorRow(BaseModel):
    row: int  # 1-based row number in the source file (excluding header)
    field: str
    message: str
    value: Optional[str] = None


class ImportValidationResult(BaseModel):
    import_type: str
    valid: bool
    total_rows: int
    valid_rows: int
    invalid_rows: int
    errors: List[ImportErrorRow] = []
    preview: List[dict] = []


class ImportCommitResult(BaseModel):
    import_type: str
    inserted: int
    updated: int
    failed: int
