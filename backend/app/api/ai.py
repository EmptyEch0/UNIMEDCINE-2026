from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import schemas
from app.api.auth import get_current_student
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/diagnose")
def diagnose_symptoms(
    req: schemas.SymptomAnalysisRequest
):
    analysis = AIService.analyze_symptoms(
        age=req.age,
        gender=req.gender,
        symptoms=req.symptoms,
        duration=req.duration,
        temp=req.temperature,
        history=req.medical_history,
        allergies=req.allergies,
        medicines=req.current_medicines
    )
    return analysis

@router.post("/scan")
def scan_image(
    image_type: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No scan image provided")
        
    analysis = AIService.analyze_image(image_type=image_type)
    return analysis
