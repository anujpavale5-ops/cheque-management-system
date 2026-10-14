import cv2
import numpy as np
from typing import Dict, Any, List

def analyze_image_quality(image: np.ndarray) -> Dict[str, Any]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur_score = cv2.Laplacian(gray, cv2.CV_64F).var()
    is_blurry = blur_score < 50.0  # Lowered threshold
    
    brightness = np.mean(gray)
    is_too_dark = brightness < 30
    is_too_bright = brightness > 240
    
    # Glare is normal on checks. Only flag as severe if > 20%. Mild if > 5%.
    glare_mask = cv2.inRange(gray, 240, 255)
    glare_ratio = cv2.countNonZero(glare_mask) / (gray.shape[0] * gray.shape[1])
    
    return {
        "blur_score": float(blur_score),
        "brightness_score": float(brightness),
        "glare_ratio": float(glare_ratio),
        "is_blurry": bool(is_blurry),
        "is_too_dark": bool(is_too_dark),
        "is_too_bright": bool(is_too_bright)
    }

def detect_document_boundary(image: np.ndarray) -> Dict[str, Any]:
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blurred, 50, 150)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    closed = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)
    
    contours, _ = cv2.findContours(closed.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    if not contours:
        return {"boundary_detected": False, "confidence": 0.1, "reason": "No shapes detected"}
        
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
    img_area = image.shape[0] * image.shape[1]
    
    document_contour = None
    max_area = 0
    exact_corners = False
    
    for c in contours:
        area = cv2.contourArea(c)
        if area < img_area * 0.1:
            break
            
        perimeter = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * perimeter, True)
        
        if len(approx) == 4:
            document_contour = approx
            max_area = area
            exact_corners = True
            break
            
    # FALLBACK: If no exact 4 corners, use the bounding box of the largest contour
    if document_contour is None:
        largest_area = cv2.contourArea(contours[0])
        if largest_area > img_area * 0.15:
            # Create a 4-point contour from the bounding rect
            x, y, w, h = cv2.boundingRect(contours[0])
            document_contour = np.array([[[x, y]], [[x+w, y]], [[x+w, y+h]], [[x, y+h]]])
            max_area = largest_area
            exact_corners = False
        else:
            return {"boundary_detected": False, "confidence": 0.2, "reason": "No plausible document region found"}
            
    area_ratio = max_area / img_area
    confidence = 0.95 if exact_corners else min(0.85, area_ratio + 0.4)
    
    return {
        "boundary_detected": True,
        "exact_corners": exact_corners,
        "confidence": float(confidence),
        "reason": "Boundary detected" if exact_corners else "Boundary inferred from bounding box"
    }

def run_scrutiny_pipeline(image_bytes: bytes) -> Dict[str, Any]:
    nparr = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        return {"is_cheque": False, "issues": ["Could not decode image"]}
        
    quality_res = analyze_image_quality(image)
    boundary_res = detect_document_boundary(image)
    
    issues = []
    warnings = []
    
    # Hard rejections (Issues)
    if quality_res["is_too_dark"]:
        issues.append("Image is completely unreadable (too dark).")
    if not boundary_res["boundary_detected"]:
        issues.append("No document found in the image.")
    if quality_res["is_blurry"]:
        issues.append("Image is severely blurred, rendering OCR impossible.")
        
    # Soft rejections (Warnings)
    if quality_res["glare_ratio"] > 0.20:
        warnings.append("Severe glare detected, OCR accuracy may drop.")
    elif quality_res["glare_ratio"] > 0.05:
        warnings.append("Minor glare detected.")
        
    if boundary_res["boundary_detected"] and not boundary_res.get("exact_corners", False):
        warnings.append("Exact four corners not visible; falling back to regional crop.")
        
    # Scoring
    base_confidence = boundary_res.get("confidence", 0.0)
    
    is_cheque = len(issues) == 0
    status = "good" if is_cheque and len(warnings) == 0 else ("acceptable" if is_cheque else "poor")

    return {
        "is_cheque": bool(is_cheque),
        "confidence": round(float(base_confidence), 2),
        "image_quality": status,
        "document_boundary": boundary_res.get("boundary_detected", False),
        "blur_score": quality_res["blur_score"],
        "brightness_score": quality_res["brightness_score"],
        "glare_detected": quality_res["glare_ratio"] > 0.05,
        "reason": issues[0] if issues else (warnings[0] if warnings else "Verified"),
        "issues": issues,
        "warnings": warnings
    }
