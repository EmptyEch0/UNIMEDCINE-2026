# UniMedicine

UniMedicine is an AI-powered student healthcare and telemedicine platform developed for university campuses. The platform connects students, doctors, campus clinics, and administrators into a unified digital health ecosystem. It features automated AI symptom assessment, telemedicine video consultations, appointment scheduling, digital prescriptions, medicine reminders, campus health alerts, and emergency response workflows.

---

## Table of Contents

- Architecture Overview
- Tech Stack
- Directory Structure
- Prerequisites
- Environment Configuration
- Database Setup
- Installation and Setup
  - Backend Setup
  - Frontend Setup
  - Local AI Model Setup (Ollama)
  - Machine Learning Model
- API Endpoints Summary
- License

---

## Architecture Overview

UniMedicine is structured as a client-server architecture:

- Frontend: A modern single-page application built using React 19, TypeScript, Vite, Tailwind CSS v4, Zustand for client state, and TanStack React Query for asynchronous data caching.
- Backend: A high-performance RESTful and WebSocket API service powered by FastAPI (Python 3.10+), SQLAlchemy ORM, and Pydantic v2 data validation.
- Database: A PostgreSQL relational database with schema integrity, foreign keys, cascade rules, and automated table generation.
- Artificial Intelligence: Hybrid AI architecture using a trained Scikit-learn disease classification model alongside a local Ollama instance running Qwen 2.5 for medical triage assistance.

---

## Tech Stack

### Frontend
- Framework: React 19 (TypeScript)
- Build System: Vite
- Styling: Tailwind CSS v4, PostCSS
- Routing: React Router DOM v7
- State Management: Zustand
- Data Fetching: TanStack React Query v5
- UI Components & Animations: Lucide React, Framer Motion
- Forms: React Hook Form

### Backend
- Framework: FastAPI 0.110+
- Server: Uvicorn
- Database ORM: SQLAlchemy 2.0+
- Database Driver: Psycopg2 (PostgreSQL)
- Schema Validation: Pydantic v2
- Authentication: Python-Jose (JWT with HS256), Passlib (Bcrypt)
- Real-Time Communication: WebSockets
- AI Integration: OpenAI Python SDK (compatible with Ollama API endpoint)

### Machine Learning
- Libraries: Scikit-learn, Pandas, NumPy, Pickle
- Model: Random Forest / Gradient Boosting Classifier trained on multi-symptom medical datasets
- Local LLM: Ollama (Qwen 2.5:3b)

---

## Directory Structure

```
Unimedicine/
|-- backend/
|   |-- app/
|   |   |-- api/                 # API route handlers
|   |   |   |-- admin.py
|   |   |   |-- ai.py
|   |   |   |-- appointments.py
|   |   |   |-- auth.py
|   |   |   |-- chats.py
|   |   |   |-- doctors.py
|   |   |   |-- hospitals.py
|   |   |   |-- notices.py
|   |   |   |-- notifications.py
|   |   |   |-- prescriptions.py
|   |   |   |-- records.py
|   |   |   |-- reminders.py
|   |   |   |-- slots.py
|   |   |   `-- summaries.py
|   |   |-- core/                # Core configurations and database setup
|   |   |   |-- config.py
|   |   |   `-- database.py
|   |   |-- models/              # SQLAlchemy database models
|   |   |-- schemas/             # Pydantic data schemas
|   |   |-- services/            # Business logic and external service integrations
|   |   `-- main.py              # Application entrypoint
|   |-- uploads/                 # Static uploads (prescriptions, medical records)
|   |-- .env                     # Local environment file
|   |-- .env.example             # Template environment file
|   `-- requirements.txt         # Python package dependencies
|-- frontend/
|   |-- public/                  # Static assets and images
|   |-- src/
|   |   |-- components/          # Reusable UI components
|   |   |   |-- EcgLoader.tsx
|   |   |   `-- VideoCallModal.tsx
|   |   |-- data/                # Static data catalogs (e.g. otc_guidance.json)
|   |   |-- pages/               # Application view pages
|   |   |-- store/               # Zustand state stores
|   |   |-- types/               # TypeScript interfaces and types
|   |   |-- App.tsx
|   |   `-- main.tsx
|   |-- package.json
|   |-- tailwind.config.js
|   `-- vite.config.ts
|-- database/
|   |-- unimedicine_setup.sql    # Complete PostgreSQL schema and seed data
|   |-- schema.sql
|   `-- migration_v2.sql
|-- Model Training/
|   `-- archive (1)/
|       |-- train_disease_model.py
|       |-- best_disease_model.pkl
|       |-- label_encoder.pkl
|       |-- symptom_columns.pkl
|       |-- Training.csv
|       `-- Testing.csv
|-- .gitignore
`-- README.md
```

---

## Prerequisites

Before starting, ensure you have the following installed:

- Python: Version 3.10, 3.11, or 3.12
- Node.js: Version 18.x, 20.x, or 22.x
- npm: Version 9.x or higher
- PostgreSQL: Version 14, 15, or 16
- Git: Version 2.30 or higher
- Ollama (Optional for local LLM inference): Version 0.1.30 or higher

---

## Environment Configuration

The backend reads its configurations from the `.env` file located in the `backend/` directory.

### Backend `.env` Reference

Create or verify the `backend/.env` file:

```env
# UniMedicine Database Credentials
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/unimedicine

# Security configurations
SECRET_KEY=supersecretkeyforjntugvstudenthealthplatform2026

# Local LLM Config (Ollama)
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:3b
```

### Detailed Environment Variables Description

- `DATABASE_URL`: PostgreSQL connection string using the standard format:
  `postgresql://<username>:<password>@<host>:<port>/<database_name>`
  Example: `postgresql://postgres:postgres@localhost:5432/unimedicine`

- `SECRET_KEY`: High-entropy secret string used to sign and verify JSON Web Tokens (JWT) for student and doctor sessions.

- `OLLAMA_API_URL`: Address where the Ollama local daemon is running. Default is `http://localhost:11434`.

- `OLLAMA_MODEL`: Target model tag pulled into Ollama for clinical assistant processing. Default is `qwen2.5:3b`.

---

## Database Setup

1. Start your PostgreSQL service.

2. Create the target database:

```sql
CREATE DATABASE unimedicine;
```

3. Initialize the schema, relations, and initial seeds using the setup script:

On Linux / macOS:
```bash
psql -U postgres -d unimedicine -f database/unimedicine_setup.sql
```

On Windows (PowerShell / Command Prompt):
```powershell
Get-Content database\unimedicine_setup.sql | psql -U postgres -d unimedicine
```

The database script initializes 16 tables:
- `users`: University student profiles (program, branch, hostel details)
- `doctors`: Doctor qualifications, specializations, consultation fees, ratings
- `hospitals`: Campus and network hospital locations
- `health_notices`: Public university health advisories and notices
- `medicine_reminders`: Student medication adherence alarms and schedules
- `medical_records`: Digital patient health files and diagnostic reports
- `doctor_slots`: Doctor availability slots
- `appointments`: Booking entries with status tracking
- `chats`: Conversation channels between students and medical professionals
- `messages`: Chat message records with attachments
- `message_reactions`: Emoji reaction records on messages
- `notifications`: User notifications for reminders, updates, and schedule changes
- `consultation_summaries`: Post-consultation doctor notes and diagnosis records
- `prescriptions`: Digital prescriptions generated by attending physicians
- `prescription_medicines`: Specific medicine dosage and duration items per prescription
- `patient_timeline_events`: Unified medical timeline tracking for students

---

## Installation and Setup

### 1. Backend Setup

Open a terminal and navigate to `backend`:

```bash
cd backend
```

Create and activate a virtual environment:

On Windows:
```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

On Linux / macOS:
```bash
python3 -m venv venv
source venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Run the backend server:

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The backend API will be available at:
- API Root: `http://localhost:8000/`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- ReDoc Docs: `http://localhost:8000/redoc`

### 2. Frontend Setup

Open a separate terminal and navigate to `frontend`:

```bash
cd frontend
```

Install frontend dependencies:

```bash
npm install
```

Start the Vite development server:

```bash
npm run dev
```

The frontend application will be available at:
- Web App: `http://localhost:5173/`

### 3. Local AI Model Setup (Ollama)

To enable offline AI medical assistance and symptom triage:

1. Download and install Ollama from https://ollama.com.
2. Pull the designated model:

```bash
ollama run qwen2.5:3b
```

3. Ensure the service is active and listening on `http://localhost:11434`.

### 4. Machine Learning Model Training (Optional)

Pre-trained model artifacts are included under `Model Training/archive (1)/`. To re-train or fine-tune the disease classifier:

```bash
cd "Model Training/archive (1)"
python train_disease_model.py
```

This updates `best_disease_model.pkl`, `label_encoder.pkl`, and `symptom_columns.pkl`.

---

## Key Features

- Student and Staff Authentication: Role-based access control with hashed passwords and JWT.
- Telemedicine Video Consultations: In-browser video interface with audio/video controls (`VideoCallModal.tsx`).
- OTC Medicine Guidance: Comprehensive catalog for common symptoms and over-the-counter medicine safety (`otc_guidance.json`).
- Dynamic Diagnostic Visualizations: Animated ECG monitor visual feedback loader (`EcgLoader.tsx`).
- Digital Health Records: Upload, view, and organize lab tests and medical histories.
- Medicine Reminders: Configurable notifications to ensure student medication compliance.
- Emergency SOS & Network Hospitals: Quick-access campus emergency directory and map.

---

## API Endpoints Summary

Base URL: `/api`

### Authentication (`/api/auth`)
- `POST /api/auth/register`: Register new student or user
- `POST /api/auth/login`: Authenticate and receive JWT access token
- `GET /api/auth/me`: Fetch authenticated user profile

### Doctors & Scheduling
- `GET /api/doctors`: List registered doctors and specializations
- `GET /api/doctors/{id}`: Retrieve detailed doctor profile
- `GET /api/slots`: Retrieve available consultation time slots
- `POST /api/appointments`: Book an appointment
- `GET /api/appointments`: List appointments for current user

### Telemedicine & Consultations
- `GET /api/chats`: List active chat conversations
- `POST /api/chats`: Initialize consultation chat
- `GET /api/summaries`: Retrieve consultation clinical summaries
- `GET /api/prescriptions`: Retrieve patient prescription records

### AI & Health Tools
- `POST /api/ai/diagnose`: Predict probable condition from symptom list using trained model
- `POST /api/ai/chat`: Interactive medical query response via Ollama
- `GET /api/notices`: Fetch active campus health advisories
- `GET /api/reminders`: List active medication reminders
- `GET /api/hospitals`: Directory of campus and local hospitals

---

## License

This project is distributed under the MIT License. See the LICENSE file for details.
