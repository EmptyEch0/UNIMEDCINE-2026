from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_user_or_doctor, get_current_student, get_current_doctor
from app.api.notifications import create_notification

router = APIRouter(prefix="/appointments", tags=["appointments"])


# ─── Get My Appointments ─────────────────────────────────────────────────────

@router.get("", response_model=List[schemas.AppointmentResponse])
def get_my_appointments(
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    role = current["type"]
    obj = current["obj"]

    if role == "student":
        return db.query(models.Appointment).filter(
            models.Appointment.student_id == obj.id
        ).order_by(models.Appointment.appointment_date.desc()).all()
    else:
        return db.query(models.Appointment).filter(
            models.Appointment.doctor_id == obj.id
        ).order_by(models.Appointment.appointment_date.desc()).all()


# ─── Student: Book Appointment ───────────────────────────────────────────────

@router.post("", response_model=schemas.AppointmentResponse)
def create_appointment(
    appointment_data: schemas.AppointmentCreate,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    # Verify doctor exists
    doctor = db.query(models.Doctor).filter(
        models.Doctor.id == appointment_data.doctor_id
    ).first()
    if not doctor:
        raise HTTPException(status_code=404, detail="Doctor not found")

    # Verify slot exists and is available
    slot = db.query(models.DoctorSlot).filter(
        models.DoctorSlot.id == appointment_data.slot_id,
        models.DoctorSlot.doctor_id == appointment_data.doctor_id,
        models.DoctorSlot.status == "available"
    ).first()
    if not slot:
        raise HTTPException(
            status_code=400,
            detail="Slot is not available. It may already be booked."
        )

    # Create appointment
    db_appointment = models.Appointment(
        student_id=student.id,
        doctor_id=appointment_data.doctor_id,
        slot_id=appointment_data.slot_id,
        appointment_date=appointment_data.appointment_date,
        reason=appointment_data.reason,
        status="scheduled"
    )
    db.add(db_appointment)
    db.flush()  # get appointment ID

    # Lock the slot
    slot.status = "booked"
    slot.appointment_id = db_appointment.id

    # Log timeline event
    event = models.PatientTimelineEvent(
        appointment_id=db_appointment.id,
        student_id=student.id,
        event_type="booked",
        description=f"Appointment booked with Dr. {doctor.full_name} for {slot.start_time} – {slot.end_time}."
    )
    db.add(event)

    # Notify doctor
    create_notification(
        db,
        recipient_type="doctor",
        recipient_id=doctor.id,
        title="New Appointment Booked",
        message=f"{student.full_name} booked slot {slot.start_time} – {slot.end_time} on {slot.slot_date}.",
        notif_type="appointment"
    )

    db.commit()
    db.refresh(db_appointment)
    return db_appointment


# ─── Doctor: Accept Appointment ──────────────────────────────────────────────

@router.patch("/{appointment_id}/accept", response_model=schemas.AppointmentResponse)
def accept_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.doctor_id == doctor.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    appointment.status = "accepted"

    event = models.PatientTimelineEvent(
        appointment_id=appointment_id,
        student_id=appointment.student_id,
        event_type="accepted",
        description=f"Dr. {doctor.full_name} accepted your appointment."
    )
    db.add(event)

    create_notification(
        db,
        recipient_type="student",
        recipient_id=appointment.student_id,
        title="Appointment Accepted",
        message=f"Dr. {doctor.full_name} accepted your appointment.",
        notif_type="appointment"
    )

    db.commit()
    db.refresh(appointment)
    return appointment


# ─── Update Status (complete / cancel) ───────────────────────────────────────

@router.patch("/{appointment_id}/status", response_model=schemas.AppointmentResponse)
def update_appointment_status(
    appointment_id: int,
    status: str,
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    obj = current["obj"]
    role = current["type"]
    if role == "student" and appointment.student_id != obj.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role == "doctor" and appointment.doctor_id != obj.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    appointment.status = status

    # Release the slot on cancellation
    if status == "cancelled" and appointment.slot_id:
        slot = db.query(models.DoctorSlot).filter(
            models.DoctorSlot.id == appointment.slot_id
        ).first()
        if slot:
            slot.status = "available"
            slot.appointment_id = None

        # Notify the other party
        event = models.PatientTimelineEvent(
            appointment_id=appointment_id,
            student_id=appointment.student_id,
            event_type="cancelled",
            description="Appointment was cancelled."
        )
        db.add(event)

        if role == "student":
            create_notification(
                db,
                recipient_type="doctor",
                recipient_id=appointment.doctor_id,
                title="Appointment Cancelled",
                message=f"Student {obj.full_name} cancelled their appointment.",
                notif_type="appointment"
            )
        else:
            create_notification(
                db,
                recipient_type="student",
                recipient_id=appointment.student_id,
                title="Appointment Cancelled",
                message="Your appointment has been cancelled by the doctor.",
                notif_type="appointment"
            )

    if status == "completed":
        if appointment.slot_id:
            slot = db.query(models.DoctorSlot).filter(
                models.DoctorSlot.id == appointment.slot_id
            ).first()
            if slot:
                slot.status = "completed"

        event = models.PatientTimelineEvent(
            appointment_id=appointment_id,
            student_id=appointment.student_id,
            event_type="completed",
            description="Consultation completed."
        )
        db.add(event)

    db.commit()
    db.refresh(appointment)
    return appointment


# ─── Student: Reschedule Appointment ─────────────────────────────────────────

@router.post("/{appointment_id}/reschedule", response_model=schemas.AppointmentResponse)
def reschedule_appointment(
    appointment_id: int,
    data: schemas.AppointmentReschedule,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id,
        models.Appointment.student_id == student.id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    if appointment.status in ("completed", "cancelled"):
        raise HTTPException(status_code=400, detail="Cannot reschedule a completed or cancelled appointment")

    # Verify new slot is available
    new_slot = db.query(models.DoctorSlot).filter(
        models.DoctorSlot.id == data.new_slot_id,
        models.DoctorSlot.status == "available"
    ).first()
    if not new_slot:
        raise HTTPException(status_code=400, detail="New slot is not available")

    # Release old slot
    if appointment.slot_id:
        old_slot = db.query(models.DoctorSlot).filter(
            models.DoctorSlot.id == appointment.slot_id
        ).first()
        if old_slot:
            old_slot.status = "available"
            old_slot.appointment_id = None

    # Book new slot
    new_slot.status = "booked"
    new_slot.appointment_id = appointment.id
    appointment.slot_id = new_slot.id
    appointment.appointment_date = data.new_appointment_date
    appointment.status = "scheduled"

    event = models.PatientTimelineEvent(
        appointment_id=appointment_id,
        student_id=student.id,
        event_type="rescheduled",
        description=f"Appointment rescheduled to {new_slot.start_time} – {new_slot.end_time} on {new_slot.slot_date}."
    )
    db.add(event)

    create_notification(
        db,
        recipient_type="doctor",
        recipient_id=appointment.doctor_id,
        title="Appointment Rescheduled",
        message=f"{student.full_name} rescheduled to {new_slot.start_time} – {new_slot.end_time} on {new_slot.slot_date}.",
        notif_type="appointment"
    )

    db.commit()
    db.refresh(appointment)
    return appointment


# ─── Get Patient Timeline ─────────────────────────────────────────────────────

@router.get("/{appointment_id}/timeline", response_model=List[schemas.PatientTimelineEventResponse])
def get_timeline(
    appointment_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    appointment = db.query(models.Appointment).filter(
        models.Appointment.id == appointment_id
    ).first()
    if not appointment:
        raise HTTPException(status_code=404, detail="Appointment not found")

    obj = current["obj"]
    role = current["type"]
    if role == "student" and appointment.student_id != obj.id:
        raise HTTPException(status_code=403, detail="Forbidden")
    if role == "doctor" and appointment.doctor_id != obj.id:
        raise HTTPException(status_code=403, detail="Forbidden")

    return db.query(models.PatientTimelineEvent).filter(
        models.PatientTimelineEvent.appointment_id == appointment_id
    ).order_by(models.PatientTimelineEvent.created_at.asc()).all()


# ─── Doctor: Get Analytics Summary ───────────────────────────────────────────

@router.get("/analytics/doctor", response_model=dict)
def get_doctor_analytics(
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    from datetime import datetime, date
    today = date.today()

    total = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id
    ).count()
    
    today_count = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.appointment_date >= datetime.combine(today, datetime.min.time()),
        models.Appointment.appointment_date < datetime.combine(today, datetime.max.time()),
    ).count()

    completed = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.status == "completed"
    ).count()

    scheduled = db.query(models.Appointment).filter(
        models.Appointment.doctor_id == doctor.id,
        models.Appointment.status.in_(["scheduled", "accepted"])
    ).count()

    pending_chats = db.query(models.Chat).filter(
        models.Chat.doctor_id == doctor.id,
        models.Chat.is_active == True
    ).count()

    unread_msgs = db.query(models.Message).join(models.Chat).filter(
        models.Chat.doctor_id == doctor.id,
        models.Message.sender_type == "patient",
        models.Message.is_read == False
    ).count()

    return {
        "total_appointments": total,
        "today_appointments": today_count,
        "completed_consultations": completed,
        "upcoming_appointments": scheduled,
        "pending_chats": pending_chats,
        "unread_messages": unread_msgs
    }
