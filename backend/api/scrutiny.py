from fastapi import APIRouter, File, UploadFile, HTTPException
from ml_pipeline.scrutiny import run_scrutiny_pipeline
from typing import Dict, Any

router = APIRouter()

@router.post("/scrutinize")
async def scrutinize_image(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File provided is not an image.")
        
    try:
        image_bytes = await file.read()
        result = run_scrutiny_pipeline(image_bytes)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")
