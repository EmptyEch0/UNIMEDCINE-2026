from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_user_or_doctor, get_current_student

router = APIRouter(prefix="/notices", tags=["notices"])

@router.get("", response_model=List[schemas.HealthNoticeResponse])
def get_health_notices(
    db: Session = Depends(get_db),
    current = Depends(get_current_user_or_doctor)
):
    return db.query(models.HealthNotice).order_by(models.HealthNotice.date.desc()).all()

@router.post("", response_model=schemas.HealthNoticeResponse)
def create_health_notice(
    notice_data: schemas.HealthNoticeCreate,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    if not student.is_admin:
        raise HTTPException(status_code=403, detail="Only admins can publish medical notices")
        
    db_notice = models.HealthNotice(
        title=notice_data.title,
        content=notice_data.content,
        category=notice_data.category,
        date=notice_data.date
    )
    db.add(db_notice)
    db.commit()
    db.refresh(db_notice)
    return db_notice
