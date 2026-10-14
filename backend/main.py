from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import engine, Base
from api import teachers, cheques, scrutiny, ocr

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="ChequeTracker API")

# Configure CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(teachers.router, prefix="/api/teachers", tags=["Teachers"])
app.include_router(cheques.router, prefix="/api/cheques", tags=["Cheques"])
app.include_router(scrutiny.router, prefix="/api/ocr", tags=["Scrutiny Pipeline"])
app.include_router(ocr.router, prefix="/api/ocr", tags=["OCR Pipeline"])

@app.get("/")
def read_root():
    return {"message": "Welcome to ChequeTracker API"}
