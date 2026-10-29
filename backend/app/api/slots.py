from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta, date as date_type
import re

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_doctor, get_current_user_or_doctor

router = APIRouter(prefix="/slots", tags=["slots"])


def _time_to_minutes(time_str: str) -> int:
    """Convert '09:00 AM' → minutes since midnight."""
    match = re.match(r"(\d+):(\d+)\s*(AM|PM)", time_str.strip().upper())
    if not match:
        raise ValueError(f"Invalid time format: {time_str}")
    h, m, period = int(match.group(1)), int(match.group(2)), match.group(3)
    if period == "PM" and h != 12:
        h += 12
    if period == "AM" and h == 12:
        h = 0
    return h * 60 + m


def _minutes_to_time(mins: int) -> str:
    """Convert minutes since midnight → '09:00 AM'."""
    h, m = divmod(mins, 60)
    period = "AM" if h < 12 else "PM"
    if h == 0:
        h = 12
    elif h > 12:
        h -= 12
    return f"{h:02d}:{m:02d} {period}"


# ─── Doctor: Get My Slots ───────────────────────────────────────────────────

@router.get("", response_model=List[schemas.SlotResponse])
def get_my_slots(
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    return db.query(models.DoctorSlot).filter(
        models.DoctorSlot.doctor_id == doctor.id
    ).order_by(models.DoctorSlot.slot_date, models.DoctorSlot.start_time).all()


# ─── Doctor: Create Single Slot ─────────────────────────────────────────────

@router.post("", response_model=schemas.SlotResponse)
def create_slot(
    slot_data: schemas.SlotCreate,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    db_slot = models.DoctorSlot(
        doctor_id=doctor.id,
        slot_date=slot_data.slot_date,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time,
        status=slot_data.status,
        is_vacation=slot_data.is_vacation or False
    )
    db.add(db_slot)
    db.commit()
    db.refresh(db_slot)
    return db_slot


# ─── Doctor: Bulk Generate Slots ────────────────────────────────────────────

@router.post("/generate", response_model=List[schemas.SlotResponse])
@router.post("/bulk", response_model=List[schemas.SlotResponse])
def generate_slots(
    req: schemas.SlotBulkCreate,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    try:
        start_mins = _time_to_minutes(req.start_hour)
        end_mins = _time_to_minutes(req.end_hour)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    duration = req.duration_minutes or 15

    # Delete existing available slots for that date (not booked/completed)
    db.query(models.DoctorSlot).filter(
        models.DoctorSlot.doctor_id == doctor.id,
        models.DoctorSlot.slot_date == req.slot_date,
        models.DoctorSlot.status == "available"
    ).delete()

    created = []
    current = start_mins
    while current + duration <= end_mins:
        slot = models.DoctorSlot(
            doctor_id=doctor.id,
            slot_date=req.slot_date,
            start_time=_minutes_to_time(current),
            end_time=_minutes_to_time(current + duration),
            status="available"
        )
        db.add(slot)
        created.append(slot)
        current += duration

    db.commit()
    for s in created:
        db.refresh(s)
    return created


# ─── Doctor: Update Slot ─────────────────────────────────────────────────────

@router.patch("/{slot_id}", response_model=schemas.SlotResponse)
def update_slot(
    slot_id: int,
    update: schemas.SlotUpdate,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    slot = db.query(models.DoctorSlot).filter(
        models.DoctorSlot.id == slot_id,
        models.DoctorSlot.doctor_id == doctor.id
    ).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.status == "booked":
        raise HTTPException(status_code=400, detail="Cannot edit a booked slot")

    if update.start_time is not None:
        slot.start_time = update.start_time
    if update.end_time is not None:
        slot.end_time = update.end_time
    if update.status is not None:
        slot.status = update.status
    if update.is_vacation is not None:
        slot.is_vacation = update.is_vacation

    db.commit()
    db.refresh(slot)
    return slot


# ─── Doctor: Delete Slot ─────────────────────────────────────────────────────

@router.delete("/{slot_id}")
def delete_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    slot = db.query(models.DoctorSlot).filter(
        models.DoctorSlot.id == slot_id,
        models.DoctorSlot.doctor_id == doctor.id
    ).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Slot not found")
    if slot.status == "booked":
        raise HTTPException(status_code=400, detail="Cannot delete a booked slot")

    db.delete(slot)
    db.commit()
    return {"detail": "Slot deleted"}


# ─── Doctor: Block Date / Vacation ──────────────────────────────────────────

@router.post("/block", response_model=schemas.SlotResponse)
def block_date(
    req: schemas.BlockDateRequest,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    # Delete all available slots for that date
    db.query(models.DoctorSlot).filter(
        models.DoctorSlot.doctor_id == doctor.id,
        models.DoctorSlot.slot_date == req.slot_date,
        models.DoctorSlot.status == "available"
    ).delete()

    # Create a single blocked/vacation entry for the day
    slot = models.DoctorSlot(
        doctor_id=doctor.id,
        slot_date=req.slot_date,
        start_time="00:00 AM",
        end_time="11:59 PM",
        status="blocked",
        is_vacation=req.is_vacation or False
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


# ─── Public: Get Available Slots for a Doctor (Student view) ─────────────────

@router.get("/doctor/{doctor_id}", response_model=List[schemas.SlotResponse])
def get_doctor_slots(
    doctor_id: int,
    db: Session = Depends(get_db)
):
    return db.query(models.DoctorSlot).filter(
        models.DoctorSlot.doctor_id == doctor_id,
        models.DoctorSlot.status == "available"
    ).order_by(models.DoctorSlot.slot_date, models.DoctorSlot.start_time).all()
