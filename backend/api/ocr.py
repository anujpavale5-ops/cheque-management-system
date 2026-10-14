from fastapi import APIRouter, File, UploadFile, HTTPException
from typing import Dict, Any
from ml_pipeline.perspective import correct_perspective
from ml_pipeline.ocr_engine import process_cheque_ocr

router = APIRouter()

@router.post("/process")
async def process_image(file: UploadFile = File(...)):
    """
    Takes an image, applies perspective correction, and runs OCR to extract fields.
    """
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    try:
        image_bytes = await file.read()
        
        # 1. Perspective Correction
        warped_image = correct_perspective(image_bytes)
        
        # 2. OCR Extraction
        structured_data = process_cheque_ocr(warped_image)
        
        return structured_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error during OCR processing: {str(e)}")
