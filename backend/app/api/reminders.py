from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_student

router = APIRouter(prefix="/reminders", tags=["reminders"])

@router.get("", response_model=List[schemas.MedicineReminderResponse])
def get_my_reminders(
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    return db.query(models.MedicineReminder).filter(models.MedicineReminder.user_id == student.id).all()

@router.post("", response_model=schemas.MedicineReminderResponse)
def create_reminder(
    reminder_data: schemas.MedicineReminderCreate,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    db_reminder = models.MedicineReminder(
        user_id=student.id,
        name=reminder_data.name,
        dose=reminder_data.dose,
        time=reminder_data.time,
        repeat_days=reminder_data.repeat_days or "Daily"
    )
    db.add(db_reminder)
    db.commit()
    db.refresh(db_reminder)
    return db_reminder

@router.patch("/{reminder_id}/toggle", response_model=schemas.MedicineReminderResponse)
def toggle_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    reminder = db.query(models.MedicineReminder).filter(
        models.MedicineReminder.id == reminder_id,
        models.MedicineReminder.user_id == student.id
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    reminder.is_active = not reminder.is_active
    db.commit()
    db.refresh(reminder)
    return reminder

@router.delete("/{reminder_id}")
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    reminder = db.query(models.MedicineReminder).filter(
        models.MedicineReminder.id == reminder_id,
        models.MedicineReminder.user_id == student.id
    ).first()
    
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
        
    db.delete(reminder)
    db.commit()
    return {"detail": "Reminder deleted"}
