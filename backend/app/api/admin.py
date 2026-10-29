from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_student

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_student)
):
    if not admin.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden. Admin access required.")
        
    students_count = db.query(models.User).filter(models.User.is_admin == False).count()
    doctors_count = db.query(models.Doctor).count()
    appointments_count = db.query(models.Appointment).count()
    active_chats_count = db.query(models.Chat).filter(models.Chat.is_active == True).count()
    notices_count = db.query(models.HealthNotice).count()
    reminders_count = db.query(models.MedicineReminder).count()
    
    # Recent items
    recent_appointments = db.query(models.Appointment).order_by(models.Appointment.created_at.desc()).limit(5).all()
    recent_notices = db.query(models.HealthNotice).order_by(models.HealthNotice.created_at.desc()).limit(5).all()
    
    # Format appointments
    appointments_list = []
    for appt in recent_appointments:
        appointments_list.append({
            "id": appt.id,
            "student_name": appt.student.full_name if appt.student else "Anonymous",
            "doctor_name": appt.doctor.full_name if appt.doctor else "Unknown",
            "date": appt.appointment_date.isoformat(),
            "status": appt.status
        })
        
    return {
        "metrics": {
            "students": students_count,
            "doctors": doctors_count,
            "appointments": appointments_count,
            "active_chats": active_chats_count,
            "notices": notices_count,
            "reminders": reminders_count
        },
        "recent_appointments": appointments_list,
        "recent_notices": [
            {
                "id": n.id,
                "title": n.title,
                "category": n.category,
                "date": n.date.isoformat()
            }
            for n in recent_notices
        ]
    }

@router.get("/students", response_model=List[schemas.UserResponse])
def get_all_students(
    db: Session = Depends(get_db),
    admin: models.User = Depends(get_current_student)
):
    if not admin.is_admin:
        raise HTTPException(status_code=403, detail="Forbidden. Admin access required.")
    return db.query(models.User).filter(models.User.is_admin == False).all()
