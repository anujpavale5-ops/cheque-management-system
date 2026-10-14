from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime

# --- Teacher Schemas ---
class TeacherBase(BaseModel):
    name: str
    account_number: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class TeacherCreate(TeacherBase):
    pass

class TeacherResponse(TeacherBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

# --- Cheque Schemas ---
class ChequeBase(BaseModel):
    cheque_number: Optional[str] = None
    account_number: Optional[str] = None
    bank_name: Optional[str] = None
    branch_name: Optional[str] = None
    ifsc_code: Optional[str] = None
    micr_code: Optional[str] = None
    payee_name: Optional[str] = None
    amount: Optional[float] = None
    amount_in_words: Optional[str] = None
    cheque_date: Optional[date] = None
    cheque_type: Optional[str] = None
    signature_present: Optional[bool] = None
    status: Optional[str] = "COLLECTED"
    ocr_confidence: Optional[float] = None

class ChequeCreate(ChequeBase):
    teacher_id: Optional[int] = None

class ChequeResponse(ChequeBase):
    id: int
    teacher_id: Optional[int] = None
    original_image_path: Optional[str] = None
    processed_image_path: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True
