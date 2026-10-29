from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from app.core.database import get_db
from app.core.config import settings
from app.core.security import get_password_hash, verify_password, create_access_token
from app.models import models
from app.schemas import schemas

router = APIRouter(prefix="/auth", tags=["auth"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login-form-compatibility")

def get_current_user_or_doctor(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None or role is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    if role == "student" or role == "admin":
        user = db.query(models.User).filter(models.User.id == int(user_id)).first()
        if user is None:
            raise credentials_exception
        return {"type": "student", "obj": user}
    elif role == "doctor":
        doctor = db.query(models.Doctor).filter(models.Doctor.id == int(user_id)).first()
        if doctor is None:
            raise credentials_exception
        return {"type": "doctor", "obj": doctor}
    
    raise credentials_exception

def get_current_student(current = Depends(get_current_user_or_doctor)):
    if current["type"] != "student":
        raise HTTPException(status_code=403, detail="Access denied. Student account required.")
    return current["obj"]

def get_current_doctor(current = Depends(get_current_user_or_doctor)):
    if current["type"] != "doctor":
        raise HTTPException(status_code=403, detail="Access denied. Doctor account required.")
    return current["obj"]


@router.post("/register", response_model=schemas.UserResponse)
def register_student(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already registered")
    
    # Check if admin email
    is_admin = user_data.email.endswith("@admin.unimed.edu")
    
    db_user = models.User(
        email=user_data.email,
        password_hash=get_password_hash(user_data.password),
        full_name=user_data.full_name,
        is_admin=is_admin
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


@router.post("/doctor/register", response_model=schemas.DoctorResponse)
def register_doctor(doctor_data: schemas.DoctorCreate, db: Session = Depends(get_db)):
    # Check if doctor already exists
    existing = db.query(models.Doctor).filter(models.Doctor.email == doctor_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Doctor email is already registered")
    
    db_doctor = models.Doctor(
        email=doctor_data.email,
        password_hash=get_password_hash(doctor_data.password),
        full_name=doctor_data.full_name,
        specialization=doctor_data.specialization,
        experience=doctor_data.experience,
        photo_url=doctor_data.photo_url or "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"
    )
    db.add(db_doctor)
    db.commit()
    db.refresh(db_doctor)
    return db_doctor


@router.post("/login", response_model=schemas.Token)
def login(login_data: schemas.UserLogin, db: Session = Depends(get_db)):
    # 1. Look in Users table
    user = db.query(models.User).filter(models.User.email == login_data.email).first()
    if user and verify_password(login_data.password, user.password_hash):
        role = "admin" if user.is_admin else "student"
        token = create_access_token(subject=user.id, user_type=role)
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_type": role,
            "user_details": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "is_onboarded": user.is_onboarded,
                "program": user.program,
                "branch": user.branch,
                "hostel": user.hostel
            }
        }
    
    # 2. Look in Doctors table
    doctor = db.query(models.Doctor).filter(models.Doctor.email == login_data.email).first()
    if doctor and verify_password(login_data.password, doctor.password_hash):
        token = create_access_token(subject=doctor.id, user_type="doctor")
        return {
            "access_token": token,
            "token_type": "bearer",
            "user_type": "doctor",
            "user_details": {
                "id": doctor.id,
                "email": doctor.email,
                "full_name": doctor.full_name,
                "specialization": doctor.specialization
            }
        }
    
    raise HTTPException(status_code=400, detail="Incorrect email or password")


@router.post("/onboard", response_model=schemas.UserResponse)
def onboard_student(
    onboard_data: schemas.UserOnboard,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_student)
):
    current_user.program = onboard_data.program
    current_user.branch = onboard_data.branch
    current_user.hostel = onboard_data.hostel
    current_user.medical_history = onboard_data.medical_history
    current_user.emergency_contact = onboard_data.emergency_contact
    current_user.blood_group = onboard_data.blood_group
    current_user.allergies = onboard_data.allergies
    current_user.is_onboarded = True
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/me")
def get_me(current = Depends(get_current_user_or_doctor)):
    role = current["type"]
    obj = current["obj"]
    
    if role == "student":
        return {
            "role": "admin" if obj.is_admin else "student",
            "details": {
                "id": obj.id,
                "email": obj.email,
                "full_name": obj.full_name,
                "program": obj.program,
                "branch": obj.branch,
                "hostel": obj.hostel,
                "medical_history": obj.medical_history,
                "emergency_contact": obj.emergency_contact,
                "blood_group": obj.blood_group,
                "allergies": obj.allergies,
                "is_onboarded": obj.is_onboarded
            }
        }
    else:
        return {
            "role": "doctor",
            "details": {
                "id": obj.id,
                "email": obj.email,
                "full_name": obj.full_name,
                "specialization": obj.specialization,
                "experience": obj.experience,
                "is_online": obj.is_online,
                "rating": float(obj.rating),
                "photo_url": obj.photo_url
            }
        }
