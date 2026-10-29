from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_user_or_doctor

router = APIRouter(prefix="/doctors", tags=["doctors"])

@router.get("", response_model=List[schemas.DoctorResponse])
def list_doctors(
    specialization: Optional[str] = None,
    online_only: bool = False,
    db: Session = Depends(get_db),
    current = Depends(get_current_user_or_doctor)
):
    query = db.query(models.Doctor)
    if specialization:
        query = query.filter(models.Doctor.specialization.ilike(f"%{specialization}%"))
    if online_only:
        query = query.filter(models.Doctor.is_online == True)
    return query.all()

@router.get("/{doctor_id}", response_model=schemas.DoctorResponse)
def get_doctor_details(
    doctor_id: int,
    db: Session = Depends(get_db),
    current = Depends(get_current_user_or_doctor)
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == doctor_id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")
    return doctor
