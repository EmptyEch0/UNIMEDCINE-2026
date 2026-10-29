-- ============================================================
-- UniMedicine Platform v2.0 - Migration Script
-- Run this AFTER the base schema has been applied.
-- Safe to run multiple times (uses IF NOT EXISTS / IF NOT EXISTS)
-- ============================================================

-- ── 1. Add new columns to doctors table ─────────────────────

ALTER TABLE doctors ADD COLUMN IF NOT EXISTS qualification VARCHAR(255) DEFAULT 'MBBS';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS hospital VARCHAR(255) DEFAULT 'JNTU-GV Health Center';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS working_hours VARCHAR(100) DEFAULT '9:00 AM – 5:00 PM';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS languages VARCHAR(255) DEFAULT 'English, Telugu';
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE doctors ADD COLUMN IF NOT EXISTS max_appointments_per_day INTEGER DEFAULT 10;

-- ── 2. Add slot_id column to appointments table ──────────────

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS slot_id INTEGER;

-- ── 3. Add appointment_id column to chats table ─────────────

ALTER TABLE chats ADD COLUMN IF NOT EXISTS appointment_id INTEGER;

-- ── 4. Add extra columns to messages table ──────────────────

ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(50);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_id INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- ── 5. New Tables ────────────────────────────────────────────

-- Doctor Slots (consultation time slots)
CREATE TABLE IF NOT EXISTS doctor_slots (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    slot_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,   -- "09:00 AM"
    end_time VARCHAR(10) NOT NULL,     -- "09:15 AM"
    status VARCHAR(20) DEFAULT 'available',
    -- status: available, booked, completed, blocked, vacation
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    is_vacation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_doctor_slots_doctor_date ON doctor_slots(doctor_id, slot_date);
CREATE INDEX IF NOT EXISTS idx_doctor_slots_status ON doctor_slots(status);

-- Now add FK from appointments to doctor_slots
ALTER TABLE appointments ADD CONSTRAINT IF NOT EXISTS fk_appointments_slot
    FOREIGN KEY (slot_id) REFERENCES doctor_slots(id) ON DELETE SET NULL;

-- Add FK from chats to appointments
ALTER TABLE chats ADD CONSTRAINT IF NOT EXISTS fk_chats_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL;

-- Add reply_to FK on messages
ALTER TABLE messages ADD CONSTRAINT IF NOT EXISTS fk_messages_reply_to
    FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;

-- Message Reactions
CREATE TABLE IF NOT EXISTS message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    sender_type VARCHAR(20) NOT NULL,  -- 'patient' | 'doctor'
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    recipient_type VARCHAR(20) NOT NULL,   -- 'doctor' | 'student'
    recipient_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    notif_type VARCHAR(50) DEFAULT 'general',
    -- Types: general, appointment, chat, sos, reminder, rescheduled, cancelled
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_type, recipient_id, is_read);

-- Consultation Summaries (AI-generated)
CREATE TABLE IF NOT EXISTS consultation_summaries (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    summary_json TEXT,       -- Full AI JSON response
    doctor_notes TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prescriptions
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    hospital_name VARCHAR(255) DEFAULT 'JNTU-GV University Health Center',
    doctor_signature TEXT,   -- base64 encoded canvas signature
    notes TEXT,
    pdf_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Prescription Medicines (rows in a prescription)
CREATE TABLE IF NOT EXISTS prescription_medicines (
    id SERIAL PRIMARY KEY,
    prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    dosage VARCHAR(100),
    morning BOOLEAN DEFAULT FALSE,
    afternoon BOOLEAN DEFAULT FALSE,
    night BOOLEAN DEFAULT FALSE,
    days INTEGER DEFAULT 3,
    instructions TEXT
);

-- Patient Timeline Events (audit log)
CREATE TABLE IF NOT EXISTS patient_timeline_events (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    -- Types: booked, accepted, rescheduled, report_uploaded, chat_started,
    -- doctor_replied, video_started, prescription_sent, completed,
    -- summary_generated, cancelled
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timeline_appointment ON patient_timeline_events(appointment_id);
CREATE INDEX IF NOT EXISTS idx_timeline_student ON patient_timeline_events(student_id);
