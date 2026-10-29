-- ============================================================
-- UNIMEDICINE PLATFORM v2.0 - COMPLETE DATABASE SETUP
-- Database: unimedicine
-- ============================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist to start fresh
DROP TABLE IF EXISTS patient_timeline_events CASCADE;
DROP TABLE IF EXISTS prescription_medicines CASCADE;
DROP TABLE IF EXISTS prescriptions CASCADE;
DROP TABLE IF EXISTS consultation_summaries CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS message_reactions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS doctor_slots CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS medicine_reminders CASCADE;
DROP TABLE IF EXISTS health_notices CASCADE;
DROP TABLE IF EXISTS hospitals CASCADE;
DROP TABLE IF EXISTS doctors CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ─────────────────────────────────────────────────────────────
-- TABLE CREATION
-- ─────────────────────────────────────────────────────────────

-- 1. Users (Students) Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    program VARCHAR(10), -- UG or PG
    branch VARCHAR(50), -- CSE, ECE, etc.
    hostel VARCHAR(20), -- BH-1, BH-2, GH-1, GH-2, Day Scholar
    medical_history TEXT,
    emergency_contact VARCHAR(50),
    blood_group VARCHAR(10),
    allergies TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_onboarded BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Doctors Table
CREATE TABLE doctors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    experience INTEGER DEFAULT 1,
    is_online BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    photo_url TEXT,
    qualification VARCHAR(255) DEFAULT 'MBBS',
    hospital VARCHAR(255) DEFAULT 'JNTU-GV Health Center',
    working_hours VARCHAR(100) DEFAULT '9:00 AM – 5:00 PM',
    languages VARCHAR(255) DEFAULT 'English, Telugu',
    bio TEXT,
    max_appointments_per_day INTEGER DEFAULT 10,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Appointments Table
CREATE TABLE appointments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    slot_id INTEGER, -- Foreign key defined later due to circular dependency
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, accepted, completed, cancelled
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Doctor Slots (consultation time slots)
CREATE TABLE doctor_slots (
    id SERIAL PRIMARY KEY,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    slot_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,   -- "09:00 AM"
    end_time VARCHAR(10) NOT NULL,     -- "09:15 AM"
    status VARCHAR(20) DEFAULT 'available', -- available, booked, completed, blocked, vacation
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    is_vacation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Circular FK Constraint Additions
ALTER TABLE appointments ADD CONSTRAINT fk_appointments_slot FOREIGN KEY (slot_id) REFERENCES doctor_slots(id) ON DELETE SET NULL;

CREATE INDEX idx_doctor_slots_doctor_date ON doctor_slots(doctor_id, slot_date);
CREATE INDEX idx_doctor_slots_status ON doctor_slots(status);

-- 5. Chats Table (for anonymous consultations)
CREATE TABLE chats (
    id SERIAL PRIMARY KEY,
    patient_anon_id VARCHAR(50) NOT NULL, -- PAT-XXXX format
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE NOT NULL,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Messages Table
CREATE TABLE messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
    sender_type VARCHAR(20) NOT NULL, -- 'patient' or 'doctor'
    content TEXT,
    file_url TEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(50),
    reply_to_id INTEGER REFERENCES messages(id) ON DELETE SET NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Message Reactions
CREATE TABLE message_reactions (
    id SERIAL PRIMARY KEY,
    message_id INTEGER REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
    sender_type VARCHAR(20) NOT NULL,  -- 'patient' | 'doctor'
    emoji VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    recipient_type VARCHAR(20) NOT NULL,   -- 'doctor' | 'student'
    recipient_id INTEGER NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    notif_type VARCHAR(50) DEFAULT 'general', -- general, appointment, chat, sos, reminder, rescheduled, cancelled
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_recipient ON notifications(recipient_type, recipient_id, is_read);

-- 9. Consultation Summaries (AI-generated)
CREATE TABLE consultation_summaries (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE NOT NULL,
    summary_json TEXT,       -- Full AI JSON response
    doctor_notes TEXT,
    is_approved BOOLEAN DEFAULT FALSE,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. Prescriptions Table
CREATE TABLE prescriptions (
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

-- 11. Prescription Medicines
CREATE TABLE prescription_medicines (
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

-- 12. Patient Timeline Events
CREATE TABLE patient_timeline_events (
    id SERIAL PRIMARY KEY,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    -- event_type: booked, accepted, rescheduled, report_uploaded, chat_started, doctor_replied, video_started, prescription_sent, completed, summary_generated, cancelled
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_timeline_appointment ON patient_timeline_events(appointment_id);
CREATE INDEX idx_timeline_student ON patient_timeline_events(student_id);

-- 13. Medical Records Table
CREATE TABLE medical_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- PDF, Prescription, Blood Report, Scan, Consultation Summary
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. Medicine Reminders Table
CREATE TABLE medicine_reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    dose VARCHAR(100) NOT NULL,
    time VARCHAR(10) NOT NULL, -- "08:00", "20:00"
    repeat_days VARCHAR(50) DEFAULT 'Daily', -- Daily, Mon-Fri, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 15. Hospitals & Clinics Table
CREATE TABLE hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Hospital, Shop, Clinic, Diagnostics, Ambulance
    image_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.50,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    is_open BOOLEAN DEFAULT TRUE
);

-- 16. Health Notices Table
CREATE TABLE health_notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- Camp, Vaccination, Announcement
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ─────────────────────────────────────────────────────────────
-- DEMO SEED DATA
-- ─────────────────────────────────────────────────────────────

-- Password hash for 'password123' used for all users so it is easy to log in.
-- Hash: $2b$12$fie4B.0w9YdcBydMpyEP1eRZrwXXLe3Et70qGm7n9NOoJS1p3UIZu

-- Insert Demo Students
INSERT INTO users (email, password_hash, full_name, program, branch, hostel, medical_history, emergency_contact, blood_group, allergies, is_admin, is_onboarded) VALUES
('student@unimed.edu', '$2b$12$fie4B.0w9YdcBydMpyEP1eRZrwXXLe3Et70qGm7n9NOoJS1p3UIZu', 'Likhith Kumar', 'UG', 'CSE', 'BH-1', 'None', '+91 98765 43210', 'O+', 'Dust allergy', false, true),
('admin@unimed.edu', '$2b$12$fie4B.0w9YdcBydMpyEP1eRZrwXXLe3Et70qGm7n9NOoJS1p3UIZu', 'Health Cell Administrator', 'N/A', 'N/A', 'Day Scholar', 'None', '+91 93929 95909', 'A+', 'None', true, true);

-- Insert Demo Doctors
INSERT INTO doctors (email, password_hash, full_name, specialization, experience, is_online, rating, photo_url, qualification, hospital, working_hours, languages, bio) VALUES
('dr.rama@unimed.edu', '$2b$12$fie4B.0w9YdcBydMpyEP1eRZrwXXLe3Et70qGm7n9NOoJS1p3UIZu', 'Dr. Rama Krishna Rao', 'General Physician', 15, true, 4.85, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150', 'MBBS, MD (General Medicine)', 'JNTU-GV University Health Cell', '9:00 AM – 5:00 PM', 'English, Telugu, Hindi', 'Serving the JNTU-GV student community for over 10 years with primary healthcare and clinical advice.'),
('dr.anitha@unimed.edu', '$2b$12$fie4B.0w9YdcBydMpyEP1eRZrwXXLe3Et70qGm7n9NOoJS1p3UIZu', 'Dr. Anitha Reddy', 'Dermatologist', 8, true, 4.70, 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150', 'MBBS, DDVL (Skin & VD)', 'JNTU-GV University Health Cell', '10:00 AM – 4:00 PM', 'English, Telugu', 'Expertise in student health conditions, skin allergies, fungal infections, acne management, and environment-induced dermatological conditions.'),
('dr.prasad@unimed.edu', '$2b$12$fie4B.0w9YdcBydMpyEP1eRZrwXXLe3Et70qGm7n9NOoJS1p3UIZu', 'Dr. V. Prasad', 'Pediatrician', 12, false, 4.60, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150', 'MBBS, DCH', 'JNTU-GV Health Center', '9:00 AM – 1:00 PM', 'English, Telugu, Hindi', 'Visiting specialist consultant for adolescent and young adult clinical physiology.');

-- Insert Health Notices
INSERT INTO health_notices (title, content, category, date) VALUES
('Free Medical Checkup Camp', 'Annual health checkup camp organized in collaboration with JNTU-GV University Medical Cell. General physicians, dentists, and eye specialists will be available.', 'Camp', CURRENT_DATE + INTERVAL '5 days'),
('Covaxin Booster Vaccination Drive', 'COVID booster dose drive for students and faculty at JNTU-GV Health Center. Please bring your Aadhar Card and previous vaccine certificates.', 'Vaccination', CURRENT_DATE + INTERVAL '2 days'),
('Blood Donation Camp 2026', 'Be a hero, save lives! Annual blood donation drive organized by NSS unit at University Auditorium. Refreshments and certificates will be provided.', 'Camp', CURRENT_DATE + INTERVAL '10 days'),
('Heatwave Health Advisory', 'Important medical notice: Vizianagaram is experiencing higher temperatures. Stay hydrated, avoid outdoor activities between 12 PM - 3 PM, and drink coconut water.', 'Announcement', CURRENT_DATE);

-- Insert Hospitals & Pharmacies
INSERT INTO hospitals (name, type, image_url, rating, latitude, longitude, address, phone, is_open) VALUES
('Venkata Padma Hospital', 'Hospital', 'https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=400', 4.4, 18.1088126, 83.4173236, 'Three Lamps Junction, AG Road, Vizianagaram', '+91 90002 67654', true),
('Queens NRI Hospital', 'Hospital', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400', 4.5, 18.1160657, 83.4029738, 'Opp SBI Main Branch, Near NCS Theatre, Vizianagaram', '08922 251777', true),
('Mahendra Hospitals', 'Hospital', 'https://images.unsplash.com/photo-1586773860418-d37222d8fce8?w=400', 4.2, 18.1159, 83.4025, 'Beside Swimming Pool, RCM Church Road, Cantonment, Vizianagaram', '08922 222555', true),
('Maharaja District Hospital', 'Hospital', 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400', 4.0, 18.1409, 83.2987, 'RCM Church Road, Vizianagaram', '08922 228800', true),
('Venkata Rama Hospital', 'Hospital', 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400', 4.3, 18.1185, 83.4045, 'Opp RTC Complex, Vizianagaram', '08922 273777', true),
('Pushpagiri Eye Hospital', 'Hospital', 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400', 4.6, 18.115508, 83.411954, 'Near TTD Kalyana Mandapam, Alaknagar, Vizianagaram', '08922 270070', true),
('Vamsi Children Hospital', 'Hospital', 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=400', 4.1, 18.1170, 83.3990, 'Vizianagaram', '9440193885', true),
('PG Star Hospital', 'Hospital', 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400', 4.3, 18.1115, 83.4060, 'Rangala Street, Ramanaidu Road, Vizianagaram', '08922 272727', true),
('A J Global Health Care Hospital', 'Hospital', 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400', 4.2, 18.1300, 83.3880, 'Beside Bhashyam School, 100 Feet Ring Road, Vinayaka Nagar, Vizianagaram', '08922 299911', true),
('MIMS Hospital, Nellimarla', 'Hospital', 'https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=400', 4.5, 18.146964, 83.445320, 'Nellimarla, Vizianagaram', '08922 240777', true),
('Apollo Pharmacy - MG Road', 'Shop', 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400', 4.5, 18.1244906, 83.3874123, 'Sri Sai Complex, MG Road, Vizianagaram', '08922 279999', true),
('MedPlus Pharmacy - Vizianagaram', 'Shop', 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400', 4.4, 18.1017172, 83.3927211, 'Near Market Area, Vizianagaram', '08922 278888', true),
('Datta Pharmacy', 'Shop', 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400', 4.1, 18.1105, 83.4008, 'D.No. 5-15-14, Kothagraharam, Vizianagaram Market', '08922 270123', true),
('MS Satyanarayana Pharmacy', 'Shop', 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400', 4.2, 18.1110, 83.4020, 'Near SKP Temple, Vizianagaram Market', '08922 271234', true),
('Pradhan Mantri Bhartiya Janaushadhi Kendra - Bodduvari Junction', 'Shop', 'https://images.unsplash.com/photo-1607619056574-7b8d304f3c6f?w=400', 4.3, 18.1150, 83.3965, 'MRO Office Road, Bodduvari Junction, Vizianagaram', '08922 276543', true);
