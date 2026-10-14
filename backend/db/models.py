from sqlalchemy import Column, Integer, String, Float, Boolean, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Teacher(Base):
    __tablename__ = "teachers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True, nullable=False)
    account_number = Column(String, index=True)
    phone = Column(String)
    email = Column(String)
    address = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    cheques = relationship("Cheque", back_populates="teacher")

class Cheque(Base):
    __tablename__ = "cheques"

    id = Column(Integer, primary_key=True, index=True)
    teacher_id = Column(Integer, ForeignKey("teachers.id"))
    
    cheque_number = Column(String, index=True)
    account_number = Column(String, index=True)
    bank_name = Column(String)
    branch_name = Column(String)
    ifsc_code = Column(String)
    micr_code = Column(String)
    payee_name = Column(String)
    amount = Column(Float)
    amount_in_words = Column(String)
    cheque_date = Column(Date)
    
    cheque_type = Column(String) # Account Payee, Bearer, etc.
    signature_present = Column(Boolean)
    
    status = Column(String, default="COLLECTED") # COLLECTED, VERIFIED, READY_FOR_DEPOSIT, DEPOSITED, CLEARED, BOUNCED
    ocr_confidence = Column(Float) # Overall confidence
    
    # Image references
    original_image_path = Column(String)
    processed_image_path = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    teacher = relationship("Teacher", back_populates="cheques")
