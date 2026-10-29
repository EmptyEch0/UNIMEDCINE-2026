from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_doctor, get_current_user_or_doctor
from app.services.ai_service import AIService

router = APIRouter(prefix="/summaries", tags=["summaries"])


# ─── Generate AI Summary for an Appointment ──────────────────────────────────

@router.post("/generate/{appointment_id}", response_model=schemas.ConsultationSummaryResponse)
def generate_summary(
    appointment_id: int,
    req: schemas.ConsultationSummaryRequest,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.doctor_id == doctor.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    # Build context from chat history
    chat = db.query(models.Chat).filter(
        models.Chat.appointment_id == appointment_id
    ).first()
    
    chat_text = req.chat_history or ""
    if chat and not chat_text:
        msgs = db.query(models.Message).filter(
            models.Message.chat_id == chat.id
        ).order_by(models.Message.created_at).all()
        chat_text = "\n".join([
            f"{m.sender_type.upper()}: {m.content}" for m in msgs if m.content
        ])

    student = appointment.student
    ai_result = AIService.generate_consultation_summary(
        chat_history=chat_text,
        doctor_notes=req.doctor_notes or "",
        patient_symptoms=req.patient_symptoms or "",
        patient_age=student.medical_history,
        doctor_name=doctor.full_name,
        specialization=doctor.specialization,
        appointment_date=appointment.appointment_date.isoformat()
    )

    # Check if summary already exists, update it
    existing = db.query(models.ConsultationSummary).filter(
        models.ConsultationSummary.appointment_id == appointment_id
    ).first()

    if existing:
        existing.summary_json = json.dumps(ai_result)
        existing.is_approved = False
        db.commit()
        db.refresh(existing)
        return existing

    summary = models.ConsultationSummary(
        appointment_id=appointment_id,
        summary_json=json.dumps(ai_result),
        doctor_notes=req.doctor_notes or ""
    )
    db.add(summary)
    db.commit()
    db.refresh(summary)
    return summary


# ─── Get Summary by Appointment ───────────────────────────────────────────────

@router.get("/{appointment_id}", response_model=schemas.ConsultationSummaryResponse)
def get_summary(
    appointment_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    summary = db.query(models.ConsultationSummary).filter(
        models.ConsultationSummary.appointment_id == appointment_id
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary


# ─── Doctor: Edit + Approve Summary ─────────────────────────────────────────

@router.patch("/{summary_id}", response_model=schemas.ConsultationSummaryResponse)
def update_summary(
    summary_id: int,
    update: schemas.SummaryUpdate,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    summary = db.query(models.ConsultationSummary).filter(
        models.ConsultationSummary.id == summary_id
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")

    if update.summary_json is not None:
        summary.summary_json = update.summary_json
    if update.doctor_notes is not None:
        summary.doctor_notes = update.doctor_notes
    if update.is_approved is not None:
        summary.is_approved = update.is_approved
        if update.is_approved:
            from datetime import datetime
            summary.approved_at = datetime.utcnow()

    db.commit()
    db.refresh(summary)
    return summary


# ─── Doctor: Send Summary to Patient (store in medical records) ───────────────

@router.post("/{summary_id}/send-to-patient")
def send_summary_to_patient(
    summary_id: int,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    summary = db.query(models.ConsultationSummary).filter(
        models.ConsultationSummary.id == summary_id
    ).first()
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    if not summary.is_approved:
        raise HTTPException(status_code=400, detail="Approve the summary before sending")

    appointment = summary.appointment
    # Create a medical record entry for the patient
    record = models.MedicalRecord(
        user_id=appointment.student_id,
        title=f"Consultation Summary - {appointment.appointment_date.strftime('%d %b %Y')}",
        file_url=f"/summaries/{summary_id}",
        record_type="Consultation Summary"
    )
    db.add(record)

    # Create notification for student
    from app.api.notifications import create_notification
    create_notification(
        db,
        recipient_type="student",
        recipient_id=appointment.student_id,
        title="Consultation Summary Available",
        message=f"Dr. {doctor.full_name} has shared your consultation summary.",
        notif_type="general"
    )

    db.commit()
    return {"detail": "Summary sent to patient's medical records"}
