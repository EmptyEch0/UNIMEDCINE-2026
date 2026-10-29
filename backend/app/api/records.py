from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from typing import List
import os
import shutil

from app.core.database import get_db
from app.models import models
from app.schemas import schemas
from app.api.auth import get_current_student

router = APIRouter(prefix="/records", tags=["records"])

# Configure local upload directory
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.get("", response_model=List[schemas.MedicalRecordResponse])
def get_my_records(
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    return db.query(models.MedicalRecord).filter(models.MedicalRecord.user_id == student.id).all()

@router.post("/upload", response_model=schemas.MedicalRecordResponse)
def upload_record(
    title: str = Form(...),
    record_type: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    # Verify file is not empty
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file selected")
        
    # Standardize filename to prevent path traversal
    safe_filename = f"{student.id}_{int(os.times()[4])}_{os.path.basename(file.filename)}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)
    
    # Save the file to local disk
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
        
    # Generate static file URL
    file_url = f"/uploads/{safe_filename}"
    
    db_record = models.MedicalRecord(
        user_id=student.id,
        title=title,
        file_url=file_url,
        record_type=record_type
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@router.delete("/{record_id}")
def delete_record(
    record_id: int,
    db: Session = Depends(get_db),
    student: models.User = Depends(get_current_student)
):
    record = db.query(models.MedicalRecord).filter(
        models.MedicalRecord.id == record_id,
        models.MedicalRecord.user_id == student.id
    ).first()
    
    if not record:
        raise HTTPException(status_code=404, detail="Medical record not found")
        
    # Try deleting actual file
    filename = os.path.basename(record.file_url)
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass
            
    db.delete(record)
    db.commit()
    return {"detail": "Medical record deleted"}
