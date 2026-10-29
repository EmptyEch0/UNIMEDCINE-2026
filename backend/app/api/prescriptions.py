from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_doctor, get_current_user_or_doctor

router = APIRouter(prefix="/prescriptions", tags=["prescriptions"])


# ─── Doctor: Create Prescription ─────────────────────────────────────────────

@router.post("", response_model=schemas.PrescriptionResponse)
def create_prescription(
    data: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    # Verify student exists
    student = db.query(models.User).filter(models.User.id == data.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    prescription = models.Prescription(
        appointment_id=data.appointment_id,
        doctor_id=doctor.id,
        student_id=data.student_id,
        hospital_name=data.hospital_name or "JNTU-GV University Health Center",
        doctor_signature=data.doctor_signature,
        notes=data.notes
    )
    db.add(prescription)
    db.flush()  # get ID before adding medicines

    for med in data.medicines:
        db_med = models.PrescriptionMedicine(
            prescription_id=prescription.id,
            name=med.name,
            dosage=med.dosage,
            morning=med.morning or False,
            afternoon=med.afternoon or False,
            night=med.night or False,
            days=med.days or 3,
            instructions=med.instructions
        )
        db.add(db_med)

    # Store in student's medical records
    record = models.MedicalRecord(
        user_id=data.student_id,
        title=f"Prescription by Dr. {doctor.full_name}",
        file_url=f"/prescriptions/{prescription.id}",
        record_type="Prescription"
    )
    db.add(record)

    # Log timeline event
    if data.appointment_id:
        event = models.PatientTimelineEvent(
            appointment_id=data.appointment_id,
            student_id=data.student_id,
            event_type="prescription_sent",
            description=f"Dr. {doctor.full_name} sent a digital prescription."
        )
        db.add(event)

    # Notify student
    from app.api.notifications import create_notification
    create_notification(
        db,
        recipient_type="student",
        recipient_id=data.student_id,
        title="New Prescription",
        message=f"Dr. {doctor.full_name} has issued a prescription for you.",
        notif_type="general"
    )

    db.commit()
    db.refresh(prescription)
    return prescription


# ─── Get Prescription by Appointment ─────────────────────────────────────────

@router.get("/appointment/{appointment_id}", response_model=schemas.PrescriptionResponse)
def get_by_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    prescription = db.query(models.Prescription).filter(
        models.Prescription.appointment_id == appointment_id
    ).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")
    return prescription


# ─── Student: My Prescriptions ───────────────────────────────────────────────

@router.get("/my", response_model=List[schemas.PrescriptionResponse])
def get_my_prescriptions(
    db: Session = Depends(get_db),
    current=Depends(get_current_user_or_doctor)
):
    if current["type"] == "doctor":
        # Doctor sees all prescriptions they issued
        return db.query(models.Prescription).filter(
            models.Prescription.doctor_id == current["obj"].id
        ).order_by(models.Prescription.created_at.desc()).all()
    else:
        return db.query(models.Prescription).filter(
            models.Prescription.student_id == current["obj"].id
        ).order_by(models.Prescription.created_at.desc()).all()


# ─── Update Prescription (before finalizing) ─────────────────────────────────

@router.patch("/{prescription_id}", response_model=schemas.PrescriptionResponse)
def update_prescription(
    prescription_id: int,
    data: schemas.PrescriptionCreate,
    db: Session = Depends(get_db),
    doctor: models.Doctor = Depends(get_current_doctor)
):
    prescription = db.query(models.Prescription).filter(
        models.Prescription.id == prescription_id,
        models.Prescription.doctor_id == doctor.id
    ).first()
    if not prescription:
        raise HTTPException(status_code=404, detail="Prescription not found")

    prescription.notes = data.notes
    prescription.doctor_signature = data.doctor_signature
    prescription.hospital_name = data.hospital_name

    # Remove old medicines and re-add
    db.query(models.PrescriptionMedicine).filter(
        models.PrescriptionMedicine.prescription_id == prescription_id
    ).delete()

    for med in data.medicines:
        db_med = models.PrescriptionMedicine(
            prescription_id=prescription_id,
            name=med.name,
            dosage=med.dosage,
            morning=med.morning or False,
            afternoon=med.afternoon or False,
            night=med.night or False,
            days=med.days or 3,
            instructions=med.instructions
        )
        db.add(db_med)

    db.commit()
    db.refresh(prescription)
    return prescription
