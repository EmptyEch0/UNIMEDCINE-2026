from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Numeric, ForeignKey, Date, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    program = Column(String(10))  # UG, PG
    branch = Column(String(50))   # CSE, ECE, EEE, etc.
    hostel = Column(String(20))   # BH-1, BH-2, GH-1, GH-2, Day Scholar
    medical_history = Column(Text)
    emergency_contact = Column(String(50))
    blood_group = Column(String(10))
    allergies = Column(Text)
    is_admin = Column(Boolean, default=False)
    is_onboarded = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    appointments = relationship("Appointment", back_populates="student")
    chats = relationship("Chat", back_populates="student")
    reminders = relationship("MedicineReminder", back_populates="user")
    records = relationship("MedicalRecord", back_populates="user")
    timeline_events = relationship("PatientTimelineEvent", back_populates="student")
    prescriptions = relationship("Prescription", back_populates="student")


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    specialization = Column(String(100), nullable=False)
    experience = Column(Integer, default=1)
    is_online = Column(Boolean, default=False)
    rating = Column(Numeric(3, 2), default=5.00)
    photo_url = Column(Text)

    # Extended profile fields
    qualification = Column(String(255), default="MBBS")
    hospital = Column(String(255), default="JNTU-GV Health Center")
    working_hours = Column(String(100), default="9:00 AM – 5:00 PM")
    languages = Column(String(255), default="English, Telugu")
    bio = Column(Text)
    max_appointments_per_day = Column(Integer, default=10)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    appointments = relationship("Appointment", back_populates="doctor")
    chats = relationship("Chat", back_populates="doctor")
    slots = relationship("DoctorSlot", back_populates="doctor")
    prescriptions = relationship("Prescription", back_populates="doctor")


class DoctorSlot(Base):
    __tablename__ = "doctor_slots"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    slot_date = Column(Date, nullable=False)
    start_time = Column(String(10), nullable=False)   # "09:00 AM"
    end_time = Column(String(10), nullable=False)     # "09:15 AM"
    # available, booked, completed, blocked, vacation
    status = Column(String(20), default="available")
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    is_vacation = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor", back_populates="slots")
    appointment = relationship("Appointment", foreign_keys=[appointment_id])


class Appointment(Base):
    __tablename__ = "appointments"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(Integer, ForeignKey("doctor_slots.id", ondelete="SET NULL"), nullable=True)
    appointment_date = Column(DateTime(timezone=True), nullable=False)
    status = Column(String(20), default="scheduled")  # scheduled, accepted, completed, cancelled
    reason = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    timeline_events = relationship("PatientTimelineEvent", back_populates="appointment")
    summary = relationship("ConsultationSummary", back_populates="appointment", uselist=False)
    prescription = relationship("Prescription", back_populates="appointment", uselist=False)


class Chat(Base):
    __tablename__ = "chats"

    id = Column(Integer, primary_key=True, index=True)
    patient_anon_id = Column(String(50), nullable=False)  # PAT-XXXX
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="SET NULL"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    student = relationship("User", back_populates="chats")
    doctor = relationship("Doctor", back_populates="chats")
    messages = relationship("Message", back_populates="chat", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(Integer, ForeignKey("chats.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(String(20), nullable=False)  # 'patient' or 'doctor'
    content = Column(Text)
    file_url = Column(Text)
    file_name = Column(String(255))
    file_type = Column(String(50))  # pdf, image, etc.
    reply_to_id = Column(Integer, ForeignKey("messages.id", ondelete="SET NULL"), nullable=True)
    is_pinned = Column(Boolean, default=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    chat = relationship("Chat", back_populates="messages")
    reply_to = relationship("Message", remote_side=[id])
    reactions = relationship("MessageReaction", back_populates="message", cascade="all, delete-orphan")


class MessageReaction(Base):
    __tablename__ = "message_reactions"

    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("messages.id", ondelete="CASCADE"), nullable=False)
    sender_type = Column(String(20), nullable=False)  # 'patient' or 'doctor'
    emoji = Column(String(10), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    message = relationship("Message", back_populates="reactions")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    recipient_type = Column(String(20), nullable=False)  # "doctor" | "student"
    recipient_id = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text)
    notif_type = Column(String(50), default="general")
    # general, appointment, chat, sos, reminder, rescheduled, cancelled
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class ConsultationSummary(Base):
    __tablename__ = "consultation_summaries"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=False)
    # JSON blob with all AI-generated sections
    summary_json = Column(Text)
    doctor_notes = Column(Text)
    is_approved = Column(Boolean, default=False)
    approved_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    appointment = relationship("Appointment", back_populates="summary")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=True)
    doctor_id = Column(Integer, ForeignKey("doctors.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    hospital_name = Column(String(255), default="JNTU-GV University Health Center")
    doctor_signature = Column(Text)  # base64 encoded canvas PNG
    notes = Column(Text)
    pdf_url = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor", back_populates="prescriptions")
    student = relationship("User", back_populates="prescriptions")
    appointment = relationship("Appointment", back_populates="prescription")
    medicines = relationship("PrescriptionMedicine", back_populates="prescription", cascade="all, delete-orphan")


class PrescriptionMedicine(Base):
    __tablename__ = "prescription_medicines"

    id = Column(Integer, primary_key=True, index=True)
    prescription_id = Column(Integer, ForeignKey("prescriptions.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    dosage = Column(String(100))
    morning = Column(Boolean, default=False)
    afternoon = Column(Boolean, default=False)
    night = Column(Boolean, default=False)
    days = Column(Integer, default=3)
    instructions = Column(Text)

    prescription = relationship("Prescription", back_populates="medicines")


class PatientTimelineEvent(Base):
    __tablename__ = "patient_timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    appointment_id = Column(Integer, ForeignKey("appointments.id", ondelete="CASCADE"), nullable=True)
    student_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    # booked, accepted, report_uploaded, chat_started, doctor_replied,
    # video_started, prescription_sent, completed, summary_generated, cancelled
    event_type = Column(String(50), nullable=False)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    appointment = relationship("Appointment", back_populates="timeline_events")
    student = relationship("User", back_populates="timeline_events")


class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(255), nullable=False)
    file_url = Column(Text, nullable=False)
    record_type = Column(String(50), nullable=False)  # PDF, Prescription, Blood Report, Scan
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="records")


class MedicineReminder(Base):
    __tablename__ = "medicine_reminders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    dose = Column(String(100), nullable=False)
    time = Column(String(10), nullable=False)  # "08:00", "20:00"
    repeat_days = Column(String(50), default="Daily")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    user = relationship("User", back_populates="reminders")


class Hospital(Base):
    __tablename__ = "hospitals"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # Hospital, Shop, Clinic, Diagnostics, Ambulance
    image_url = Column(Text)
    rating = Column(Numeric(3, 2), default=4.50)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(Text, nullable=False)
    phone = Column(String(20))
    is_open = Column(Boolean, default=True)


class HealthNotice(Base):
    __tablename__ = "health_notices"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    category = Column(String(100), nullable=False)  # Camp, Vaccination, Announcement
    date = Column(Date, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
