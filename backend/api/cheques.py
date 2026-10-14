from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from db.database import get_db
from db import models, schemas

router = APIRouter()

@router.post("/", response_model=schemas.ChequeResponse)
def create_cheque(cheque: schemas.ChequeCreate, db: Session = Depends(get_db)):
    db_cheque = models.Cheque(**cheque.dict())
    db.add(db_cheque)
    db.commit()
    db.refresh(db_cheque)
    return db_cheque

@router.get("/", response_model=List[schemas.ChequeResponse])
def read_cheques(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    cheques = db.query(models.Cheque).offset(skip).limit(limit).all()
    return cheques

@router.get("/{cheque_id}", response_model=schemas.ChequeResponse)
def read_cheque(cheque_id: int, db: Session = Depends(get_db)):
    cheque = db.query(models.Cheque).filter(models.Cheque.id == cheque_id).first()
    if cheque is None:
        raise HTTPException(status_code=404, detail="Cheque not found")
    return cheque

@router.patch("/{cheque_id}/status", response_model=schemas.ChequeResponse)
def update_cheque_status(cheque_id: int, status: str, db: Session = Depends(get_db)):
    cheque = db.query(models.Cheque).filter(models.Cheque.id == cheque_id).first()
    if cheque is None:
        raise HTTPException(status_code=404, detail="Cheque not found")
    cheque.status = status
    db.commit()
    db.refresh(cheque)
    return cheque
