from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any
from datetime import datetime, date


# ─────────────────────────────────────────────
# USER / STUDENT SCHEMAS
# ─────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOnboard(BaseModel):
    program: str
    branch: Optional[str] = None
    hostel: str
    medical_history: Optional[str] = None
    emergency_contact: str
    blood_group: str
    allergies: Optional[str] = None

class UserUpdate(BaseModel):
    full_name: str
    program: Optional[str] = None
    branch: Optional[str] = None
    hostel: Optional[str] = None
    medical_history: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    program: Optional[str] = None
    branch: Optional[str] = None
    hostel: Optional[str] = None
    medical_history: Optional[str] = None
    emergency_contact: Optional[str] = None
    blood_group: Optional[str] = None
    allergies: Optional[str] = None
    is_admin: bool
    is_onboarded: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# DOCTOR SCHEMAS
# ─────────────────────────────────────────────

class DoctorCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    specialization: str
    experience: int
    photo_url: Optional[str] = None
    qualification: Optional[str] = "MBBS"
    hospital: Optional[str] = "JNTU-GV Health Center"
    working_hours: Optional[str] = "9:00 AM – 5:00 PM"
    languages: Optional[str] = "English, Telugu"
    bio: Optional[str] = None
    max_appointments_per_day: Optional[int] = 10

class DoctorUpdate(BaseModel):
    full_name: Optional[str] = None
    specialization: Optional[str] = None
    experience: Optional[int] = None
    photo_url: Optional[str] = None
    qualification: Optional[str] = None
    hospital: Optional[str] = None
    working_hours: Optional[str] = None
    languages: Optional[str] = None
    bio: Optional[str] = None
    max_appointments_per_day: Optional[int] = None

class DoctorResponse(BaseModel):
    id: int
    email: EmailStr
    full_name: str
    specialization: str
    experience: int
    is_online: bool
    rating: float
    photo_url: Optional[str] = None
    qualification: Optional[str] = None
    hospital: Optional[str] = None
    working_hours: Optional[str] = None
    languages: Optional[str] = None
    bio: Optional[str] = None
    max_appointments_per_day: Optional[int] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────────

class Token(BaseModel):
    access_token: str
    token_type: str
    user_type: str  # 'student' or 'doctor' or 'admin'
    user_details: dict


# ─────────────────────────────────────────────
# DOCTOR SLOTS
# ─────────────────────────────────────────────

class SlotCreate(BaseModel):
    slot_date: date
    start_time: str   # "09:00 AM"
    end_time: str     # "09:15 AM"
    status: Optional[str] = "available"
    is_vacation: Optional[bool] = False

class SlotBulkCreate(BaseModel):
    slot_date: date
    start_hour: str   # "09:00 AM"
    end_hour: str     # "05:00 PM"
    duration_minutes: Optional[int] = 15

class SlotUpdate(BaseModel):
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    status: Optional[str] = None
    is_vacation: Optional[bool] = None

class SlotResponse(BaseModel):
    id: int
    doctor_id: int
    slot_date: date
    start_time: str
    end_time: str
    status: str
    appointment_id: Optional[int] = None
    is_vacation: bool
    created_at: datetime

    class Config:
        from_attributes = True

class BlockDateRequest(BaseModel):
    slot_date: date
    reason: Optional[str] = "Blocked"
    is_vacation: Optional[bool] = False


# ─────────────────────────────────────────────
# APPOINTMENTS
# ─────────────────────────────────────────────

class AppointmentCreate(BaseModel):
    doctor_id: int
    slot_id: int
    appointment_date: datetime
    reason: str

class AppointmentReschedule(BaseModel):
    new_slot_id: int
    new_appointment_date: datetime

class AppointmentResponse(BaseModel):
    id: int
    student_id: int
    doctor_id: int
    slot_id: Optional[int] = None
    appointment_date: datetime
    status: str
    reason: Optional[str] = None
    created_at: datetime
    doctor: Optional[DoctorResponse] = None
    student: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# MESSAGES & CHAT
# ─────────────────────────────────────────────

class MessageReactionResponse(BaseModel):
    id: int
    message_id: int
    sender_type: str
    emoji: str
    created_at: datetime

    class Config:
        from_attributes = True

class MessageCreate(BaseModel):
    content: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    reply_to_id: Optional[int] = None

class MessageResponse(BaseModel):
    id: int
    chat_id: int
    sender_type: str
    content: Optional[str] = None
    file_url: Optional[str] = None
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    reply_to_id: Optional[int] = None
    is_pinned: bool
    is_read: bool
    created_at: datetime
    reactions: List[MessageReactionResponse] = []

    class Config:
        from_attributes = True

class ChatCreate(BaseModel):
    doctor_id: int
    appointment_id: Optional[int] = None

class ChatResponse(BaseModel):
    id: int
    patient_anon_id: str
    student_id: int
    doctor_id: int
    appointment_id: Optional[int] = None
    is_active: bool
    created_at: datetime
    messages: List[MessageResponse] = []
    doctor: Optional[DoctorResponse] = None
    student: Optional[UserResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# NOTIFICATIONS
# ─────────────────────────────────────────────

class NotificationResponse(BaseModel):
    id: int
    recipient_type: str
    recipient_id: int
    title: str
    message: Optional[str] = None
    notif_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# CONSULTATION SUMMARY
# ─────────────────────────────────────────────

class SummaryUpdate(BaseModel):
    summary_json: Optional[str] = None  # full JSON string
    doctor_notes: Optional[str] = None
    is_approved: Optional[bool] = None

class ConsultationSummaryResponse(BaseModel):
    id: int
    appointment_id: int
    summary_json: Optional[str] = None
    doctor_notes: Optional[str] = None
    is_approved: bool
    approved_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# PRESCRIPTION
# ─────────────────────────────────────────────

class PrescriptionMedicineCreate(BaseModel):
    name: str
    dosage: Optional[str] = None
    morning: Optional[bool] = False
    afternoon: Optional[bool] = False
    night: Optional[bool] = False
    days: Optional[int] = 3
    instructions: Optional[str] = None

class PrescriptionMedicineResponse(BaseModel):
    id: int
    prescription_id: int
    name: str
    dosage: Optional[str] = None
    morning: bool
    afternoon: bool
    night: bool
    days: int
    instructions: Optional[str] = None

    class Config:
        from_attributes = True

class PrescriptionCreate(BaseModel):
    appointment_id: Optional[int] = None
    student_id: int
    hospital_name: Optional[str] = "JNTU-GV University Health Center"
    doctor_signature: Optional[str] = None
    notes: Optional[str] = None
    medicines: List[PrescriptionMedicineCreate] = []

class PrescriptionResponse(BaseModel):
    id: int
    appointment_id: Optional[int] = None
    doctor_id: int
    student_id: int
    hospital_name: Optional[str] = None
    doctor_signature: Optional[str] = None
    notes: Optional[str] = None
    pdf_url: Optional[str] = None
    created_at: datetime
    medicines: List[PrescriptionMedicineResponse] = []
    doctor: Optional[DoctorResponse] = None

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# PATIENT TIMELINE
# ─────────────────────────────────────────────

class PatientTimelineEventResponse(BaseModel):
    id: int
    appointment_id: Optional[int] = None
    student_id: int
    event_type: str
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# MEDICAL RECORDS
# ─────────────────────────────────────────────

class MedicalRecordCreate(BaseModel):
    title: str
    record_type: str  # PDF, Prescription, Blood Report, Scan

class MedicalRecordResponse(BaseModel):
    id: int
    user_id: int
    title: str
    file_url: str
    record_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# MEDICINE REMINDERS
# ─────────────────────────────────────────────

class MedicineReminderCreate(BaseModel):
    name: str
    dose: str
    time: str
    repeat_days: Optional[str] = "Daily"

class MedicineReminderResponse(BaseModel):
    id: int
    name: str
    dose: str
    time: str
    repeat_days: str
    is_active: bool

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# HEALTH NOTICES
# ─────────────────────────────────────────────

class HealthNoticeCreate(BaseModel):
    title: str
    content: str
    category: str
    date: date

class HealthNoticeResponse(BaseModel):
    id: int
    title: str
    content: str
    category: str
    date: date
    created_at: datetime

    class Config:
        from_attributes = True


# ─────────────────────────────────────────────
# AI
# ─────────────────────────────────────────────

class SymptomAnalysisRequest(BaseModel):
    age: int
    gender: str
    symptoms: str
    duration: str
    temperature: Optional[str] = ""
    medical_history: Optional[str] = ""
    allergies: Optional[str] = ""
    current_medicines: Optional[str] = ""

class ConsultationSummaryRequest(BaseModel):
    appointment_id: int
    chat_history: Optional[str] = ""
    doctor_notes: Optional[str] = ""
    patient_symptoms: Optional[str] = ""
    patient_age: Optional[int] = None
    patient_gender: Optional[str] = None


# ─────────────────────────────────────────────
# HOSPITALS
# ─────────────────────────────────────────────

class HospitalResponse(BaseModel):
    id: int
    name: str
    type: str
    image_url: Optional[str] = None
    rating: float
    latitude: float
    longitude: float
    address: str
    phone: Optional[str] = None
    is_open: bool

    class Config:
        from_attributes = True
