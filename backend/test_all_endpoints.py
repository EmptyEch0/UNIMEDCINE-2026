import sys
import os
from datetime import date, datetime, timedelta
import json

from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine, SessionLocal
from app.models import models

# Ensure test DB is created
Base.metadata.create_all(bind=engine)

client = TestClient(app)

results = []

def log_test(endpoint: str, method: str, status_code: int, expected_code: int, details: str = ""):
    pass_condition = (status_code == expected_code)
    status = "PASSED" if pass_condition else "FAILED"
    results.append({
        "endpoint": endpoint,
        "method": method,
        "status_code": status_code,
        "expected_code": expected_code,
        "status": status,
        "details": details
    })
    print(f"[{status}] {method} {endpoint} -> HTTP {status_code} (Expected {expected_code}) {details}")

print("=== STARTING COMPREHENSIVE ENDPOINT AUDIT ===")

# 1. Root & Health
res = client.get("/")
log_test("/", "GET", res.status_code, 200, res.json().get("message", ""))

res = client.get("/health")
log_test("/health", "GET", res.status_code, 200, res.json().get("status", ""))

# 2. Auth Endpoints
ts = int(datetime.now().timestamp())
student_email = f"student_{ts}@jntugv.edu.in"
admin_email = f"admin_{ts}@jntugv.edu.in"
doctor_email = f"doctor_{ts}@jntugv.edu.in"

# Register Student
res = client.post("/api/auth/register", json={
    "email": student_email,
    "password": "Password123!",
    "full_name": "Test Student"
})
log_test("/api/auth/register (Student)", "POST", res.status_code, 200)

# Register Admin Student
res = client.post("/api/auth/register", json={
    "email": admin_email,
    "password": "AdminPassword123!",
    "full_name": "Admin User"
})
log_test("/api/auth/register (Admin)", "POST", res.status_code, 200)

# Set admin flag in DB for admin_email
db = SessionLocal()
admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
if admin_user:
    admin_user.is_admin = True
    db.commit()
db.close()

# Student Login
res = client.post("/api/auth/login", json={"email": student_email, "password": "Password123!"})
log_test("/api/auth/login (Student)", "POST", res.status_code, 200)
student_token = res.json().get("access_token")
student_headers = {"Authorization": f"Bearer {student_token}"}

# Admin Login
res = client.post("/api/auth/login", json={"email": admin_email, "password": "AdminPassword123!"})
log_test("/api/auth/login (Admin)", "POST", res.status_code, 200)
admin_token = res.json().get("access_token")
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# Register Doctor
res = client.post("/api/auth/doctor/register", json={
    "email": doctor_email,
    "password": "DoctorPassword123!",
    "full_name": "Dr. Sarah Smith",
    "specialization": "General Physician",
    "experience": 8,
    "qualification": "MBBS, MD",
    "hospital": "JNTU-GV Health Center",
    "working_hours": "09:00 AM - 05:00 PM",
    "languages": "English, Telugu",
    "bio": "Experienced general practitioner."
})
log_test("/api/auth/doctor/register", "POST", res.status_code, 200)

# Doctor Login
res = client.post("/api/auth/login", json={"email": doctor_email, "password": "DoctorPassword123!", "role": "doctor"})
log_test("/api/auth/login (Doctor)", "POST", res.status_code, 200)
doctor_token = res.json().get("access_token")
doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
doctor_id = res.json().get("user", {}).get("id")

# Onboard Student
res = client.post("/api/auth/onboard", json={
    "program": "UG",
    "branch": "CSE",
    "hostel": "BH-1",
    "medical_history": "Asthma",
    "emergency_contact": "+919876543210",
    "blood_group": "O+",
    "allergies": "Dust"
}, headers=student_headers)
log_test("/api/auth/onboard", "POST", res.status_code, 200)

# Get Me
res = client.get("/api/auth/me", headers=student_headers)
log_test("/api/auth/me", "GET", res.status_code, 200, f"Role: {res.json().get('role')}")

# 3. Doctors Endpoints
res = client.get("/api/doctors", headers=student_headers)
log_test("/api/doctors", "GET", res.status_code, 200, f"Doctors count: {len(res.json())}")

if doctor_id:
    res = client.get(f"/api/doctors/{doctor_id}", headers=student_headers)
    log_test(f"/api/doctors/{doctor_id}", "GET", res.status_code, 200)

# 4. Slots Endpoints
today_str = str(date.today())

res = client.post("/api/slots", json={
    "slot_date": today_str,
    "start_time": "10:00 AM",
    "end_time": "10:15 AM",
    "status": "available"
}, headers=doctor_headers)
log_test("/api/slots", "POST", res.status_code, 200)
slot_id = res.json().get("id") if res.status_code == 200 else None

res = client.post("/api/slots/generate", json={
    "slot_date": str(date.today() + timedelta(days=1)),
    "start_hour": "09:00 AM",
    "end_hour": "11:00 AM",
    "duration_minutes": 15
}, headers=doctor_headers)
log_test("/api/slots/generate", "POST", res.status_code, 200)

res = client.post("/api/slots/bulk", json={
    "slot_date": str(date.today() + timedelta(days=2)),
    "start_hour": "02:00 PM",
    "end_hour": "04:00 PM",
    "duration_minutes": 20
}, headers=doctor_headers)
log_test("/api/slots/bulk", "POST", res.status_code, 200)

res = client.get("/api/slots", headers=doctor_headers)
log_test("/api/slots (Doctor)", "GET", res.status_code, 200)

if doctor_id:
    res = client.get(f"/api/slots/doctor/{doctor_id}")
    log_test(f"/api/slots/doctor/{doctor_id}", "GET", res.status_code, 200)

# 5. Appointments Endpoints
appointment_id = None
if doctor_id and slot_id:
    res = client.post("/api/appointments", json={
        "doctor_id": doctor_id,
        "slot_id": slot_id,
        "appointment_date": f"{today_str}T10:00:00Z",
        "reason": "Mild fever and cough"
    }, headers=student_headers)
    log_test("/api/appointments", "POST", res.status_code, 200)
    appointment_id = res.json().get("id") if res.status_code == 200 else None

res = client.get("/api/appointments", headers=student_headers)
log_test("/api/appointments (Student)", "GET", res.status_code, 200)

res = client.get("/api/appointments", headers=doctor_headers)
log_test("/api/appointments (Doctor)", "GET", res.status_code, 200)

if appointment_id:
    res = client.patch(f"/api/appointments/{appointment_id}/accept", headers=doctor_headers)
    log_test(f"/api/appointments/{appointment_id}/accept", "PATCH", res.status_code, 200)

    res = client.get(f"/api/appointments/{appointment_id}/timeline", headers=student_headers)
    log_test(f"/api/appointments/{appointment_id}/timeline", "GET", res.status_code, 200)

res = client.get("/api/appointments/analytics/doctor", headers=doctor_headers)
log_test("/api/appointments/analytics/doctor", "GET", res.status_code, 200)

# 6. Chats Endpoints
chat_id = None
if doctor_id:
    res = client.post("/api/chats", json={"doctor_id": doctor_id}, headers=student_headers)
    log_test("/api/chats", "POST", res.status_code, 200)
    chat_id = res.json().get("id") if res.status_code == 200 else None

res = client.get("/api/chats", headers=student_headers)
log_test("/api/chats (Student)", "GET", res.status_code, 200)

if chat_id:
    res = client.get(f"/api/chats/{chat_id}/messages", headers=student_headers)
    log_test(f"/api/chats/{chat_id}/messages", "GET", res.status_code, 200)

if student_token and chat_id:
    try:
        with client.websocket_connect(f"/api/chats/ws/{student_token}") as websocket:
            websocket.send_json({
                "type": "chat_message",
                "chat_id": chat_id,
                "content": "Hello Doctor!"
            })
            websocket.send_json({
                "type": "webrtc_signal",
                "chat_id": chat_id,
                "signal": {"type": "offer", "sdp": "dummy_sdp"}
            })
            log_test("/api/chats/ws/{token} (WebSocket & WebRTC Video Call)", "WS", 101, 101, "Message & WebRTC signal sent successfully")
    except Exception as e:
        log_test("/api/chats/ws/{token} (WebSocket & WebRTC Video Call)", "WS", 500, 101, str(e))

# 7. Notifications Endpoints
res = client.get("/api/notifications", headers=student_headers)
log_test("/api/notifications", "GET", res.status_code, 200)

res = client.get("/api/notifications/unread-count", headers=student_headers)
log_test("/api/notifications/unread-count", "GET", res.status_code, 200)

res = client.patch("/api/notifications/read-all", headers=student_headers)
log_test("/api/notifications/read-all", "PATCH", res.status_code, 200)

# 8. Summaries Endpoints
if appointment_id:
    res = client.post(f"/api/summaries/generate/{appointment_id}", headers=doctor_headers)
    log_test(f"/api/summaries/generate/{appointment_id}", "POST", res.status_code, 200)
    summary_id = res.json().get("id") if res.status_code == 200 else None

    if summary_id:
        res = client.get(f"/api/summaries/{appointment_id}", headers=student_headers)
        log_test(f"/api/summaries/{appointment_id}", "GET", res.status_code, 200)

        res = client.post(f"/api/summaries/{summary_id}/send-to-patient", headers=doctor_headers)
        log_test(f"/api/summaries/{summary_id}/send-to-patient", "POST", res.status_code, 200)

# 9. Prescriptions Endpoints
if doctor_id and appointment_id:
    # Fetch student ID from auth/me
    student_obj = client.get("/api/auth/me", headers=student_headers).json()
    sid = student_obj.get("user", {}).get("id")
    
    res = client.post("/api/prescriptions", json={
        "appointment_id": appointment_id,
        "doctor_id": doctor_id,
        "student_id": sid,
        "hospital_name": "JNTU-GV Health Center",
        "notes": "Take rest and drink warm water",
        "medicines": [
            {
                "name": "Paracetamol 500mg",
                "dosage": "1 tablet",
                "morning": True,
                "afternoon": False,
                "night": True,
                "days": 3,
                "instructions": "After meal"
            }
        ]
    }, headers=doctor_headers)
    log_test("/api/prescriptions", "POST", res.status_code, 200)

    res = client.get(f"/api/prescriptions/appointment/{appointment_id}", headers=student_headers)
    log_test(f"/api/prescriptions/appointment/{appointment_id}", "GET", res.status_code, 200)

res = client.get("/api/prescriptions/my", headers=student_headers)
log_test("/api/prescriptions/my", "GET", res.status_code, 200)

# 10. Health Notices Endpoints
res = client.get("/api/notices", headers=student_headers)
log_test("/api/notices", "GET", res.status_code, 200)

res = client.post("/api/notices", json={
    "title": "Free Health Checkup Camp",
    "content": "JNTU-GV Student Welfare is organizing a free health checkup camp.",
    "category": "Camp",
    "date": today_str
}, headers=admin_headers)
log_test("/api/notices", "POST", res.status_code, 200)

# 11. Medicine Reminders Endpoints
res = client.post("/api/reminders", json={
    "name": "Vitamin C",
    "dose": "1 Tablet",
    "time": "09:00 AM",
    "repeat_days": "Daily"
}, headers=student_headers)
log_test("/api/reminders", "POST", res.status_code, 200)
reminder_id = res.json().get("id") if res.status_code == 200 else None

res = client.get("/api/reminders", headers=student_headers)
log_test("/api/reminders", "GET", res.status_code, 200)

if reminder_id:
    res = client.patch(f"/api/reminders/{reminder_id}/toggle", headers=student_headers)
    log_test(f"/api/reminders/{reminder_id}/toggle", "PATCH", res.status_code, 200)

    res = client.delete(f"/api/reminders/{reminder_id}", headers=student_headers)
    log_test(f"/api/reminders/{reminder_id}", "DELETE", res.status_code, 200)

# 12. Medical Records Endpoints
res = client.get("/api/records", headers=student_headers)
log_test("/api/records", "GET", res.status_code, 200)

# 13. AI Endpoints
res = client.post("/api/ai/diagnose", json={
    "age": 20,
    "gender": "Male",
    "symptoms": "Headache, mild fever, body ache",
    "duration": "2 days"
})
log_test("/api/ai/diagnose", "POST", res.status_code, 200)

# 14. Hospitals Endpoints
res = client.get("/api/hospitals", headers=student_headers)
log_test("/api/hospitals", "GET", res.status_code, 200)

# 15. Admin Endpoints
res = client.get("/api/admin/stats", headers=admin_headers)
log_test("/api/admin/stats", "GET", res.status_code, 200)

res = client.get("/api/admin/students", headers=admin_headers)
log_test("/api/admin/students", "GET", res.status_code, 200)

# Save audit results
with open("endpoint_audit_report.json", "w") as f:
    json.dump(results, f, indent=2)

passed_count = sum(1 for r in results if r['status'] == 'PASSED')
failed_count = sum(1 for r in results if r['status'] == 'FAILED')

print("\n================ AUDIT SUMMARY ================")
print(f"TOTAL ENDPOINTS TESTED: {len(results)}")
print(f"PASSED: {passed_count}")
print(f"FAILED: {failed_count}")
print("================================================\n")
