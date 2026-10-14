import numpy as np
import cv2
from typing import Dict, Tuple

# Approximate relative coordinates (x, y, w, h) as percentages of cheque width/height
# Standard cheque proportions: ~ 20cm x 9cm (Width/Height ratio ~ 2.22)
CHEQUE_TEMPLATES = {
    "date": (0.75, 0.05, 0.20, 0.15),
    "payee": (0.10, 0.20, 0.60, 0.15),
    "amount_words": (0.10, 0.35, 0.65, 0.15),
    "amount_numbers": (0.75, 0.35, 0.20, 0.15),
    "account": (0.15, 0.55, 0.30, 0.15),
    "micr_strip": (0.10, 0.85, 0.80, 0.15)
}

def get_crop(image: np.ndarray, rect: Tuple[float, float, float, float]) -> np.ndarray:
    """
    Crops a region from the image based on percentage coordinates.
    """
    h, w = image.shape[:2]
    x_pct, y_pct, w_pct, h_pct = rect
    
    x = int(x_pct * w)
    y = int(y_pct * h)
    crop_w = int(w_pct * w)
    crop_h = int(h_pct * h)
    
    return image[y:y+crop_h, x:x+crop_w]

def extract_fields(warped_image: np.ndarray) -> Dict[str, np.ndarray]:
    """
    Takes a top-down warped cheque image and returns cropped numpy arrays for each field.
    """
    crops = {}
    for field_name, rect in CHEQUE_TEMPLATES.items():
        crops[field_name] = get_crop(warped_image, rect)
        
    return crops
