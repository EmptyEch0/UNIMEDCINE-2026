from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.core.config import settings
from app.core.database import Base, engine
from app.api import (
    auth, chats, doctors, appointments, notices, reminders,
    records, ai, hospitals, admin, slots, notifications, summaries, prescriptions
)

# Create all tables automatically (new tables will be added, existing tables preserved)
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created/verified successfully.")
except Exception as e:
    print(f"[WARNING] Error creating database tables: {e}. Check if database server is running.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="UniMedicine Platform API — AI-powered Telemedicine for JNTU-GV Students",
    version="2.0.0"
)

# CORS — allow React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and is served statically
UPLOAD_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads"
)
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ─── API Routers ─────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(chats.router, prefix="/api")
app.include_router(doctors.router, prefix="/api")
app.include_router(appointments.router, prefix="/api")
app.include_router(slots.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(summaries.router, prefix="/api")
app.include_router(prescriptions.router, prefix="/api")
app.include_router(notices.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(records.router, prefix="/api")
app.include_router(ai.router, prefix="/api")
app.include_router(hospitals.router, prefix="/api")
app.include_router(admin.router, prefix="/api")

@app.get("/")
def read_root():
    return {
        "message": "UniMedicine API v2.0 — AI-powered Telemedicine Platform, JNTU-GV",
        "status": "active",
        "version": "2.0.0"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
