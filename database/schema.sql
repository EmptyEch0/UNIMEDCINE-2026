-- PostgreSQL Schema for UniMedicine Platform

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (Students) Table
CREATE TABLE IF NOT EXISTS users (
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

-- Doctors Table
CREATE TABLE IF NOT EXISTS doctors (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    specialization VARCHAR(100) NOT NULL,
    experience INTEGER DEFAULT 1,
    is_online BOOLEAN DEFAULT FALSE,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Appointments Table
CREATE TABLE IF NOT EXISTS appointments (
    id SERIAL PRIMARY KEY,
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, completed, cancelled
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chats Table (for anonymous consultations)
CREATE TABLE IF NOT EXISTS chats (
    id SERIAL PRIMARY KEY,
    patient_anon_id VARCHAR(50) NOT NULL, -- PAT-XXXX format
    student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Messages Table
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- 'patient' or 'doctor'
    content TEXT,
    file_url TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medical Records Table
CREATE TABLE IF NOT EXISTS medical_records (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    record_type VARCHAR(50) NOT NULL, -- PDF, Prescription, Blood Report, Scan
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Medicine Reminders Table
CREATE TABLE IF NOT EXISTS medicine_reminders (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dose VARCHAR(100) NOT NULL,
    time VARCHAR(10) NOT NULL, -- "08:00", "20:00"
    repeat_days VARCHAR(50) DEFAULT 'Daily', -- Daily, Mon-Fri, etc.
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hospitals & clinics Table (Cached location data)
CREATE TABLE IF NOT EXISTS hospitals (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL, -- Hospital, Shop, Clinic, Diagnostics
    image_url TEXT,
    rating NUMERIC(3, 2) DEFAULT 4.50,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT NOT NULL,
    phone VARCHAR(20),
    is_open BOOLEAN DEFAULT TRUE
);

-- Health Notices Table (University Announcements)
CREATE TABLE IF NOT EXISTS health_notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- Camp, Vaccination, Announcement
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed Initial Data for Demo
INSERT INTO health_notices (title, content, category, date) VALUES
('Free Medical Checkup Camp', 'Annual health checkup camp organized in collaboration with JNTU-GV University Medical Cell. General physicians, dentists, and eye specialists will be available.', 'Camp', CURRENT_DATE + INTERVAL '5 days'),
('Covaxin Booster Vaccination Drive', 'COVID booster dose drive for students and faculty at JNTU-GV Health Center. Please bring your Aadhar Card and previous vaccine certificates.', 'Vaccination', CURRENT_DATE + INTERVAL '2 days'),
('Blood Donation Camp 2026', 'Be a hero, save lives! Annual blood donation drive organized by NSS unit at University Auditorium. Refreshments and certificates will be provided.', 'Camp', CURRENT_DATE + INTERVAL '10 days'),
('Heatwave Health Advisory', 'Important medical notice: Vizianagaram is experiencing higher temperatures. Stay hydrated, avoid outdoor activities between 12 PM - 3 PM, and drink coconut water.', 'Announcement', CURRENT_DATE);

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

INSERT INTO doctors (email, password_hash, full_name, specialization, experience, is_online, rating, photo_url) VALUES
('dr.rama@unimed.edu', '$2b$12$7kP2iZJ9iT.uG1eB21h1AeN4l3K6k.lS2dG3R1Y8.z79D2yD8zP0a', 'Dr. Rama Krishna Rao', 'General Physician', 15, true, 4.85, 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150'),
('dr.anitha@unimed.edu', '$2b$12$7kP2iZJ9iT.uG1eB21h1AeN4l3K6k.lS2dG3R1Y8.z79D2yD8zP0a', 'Dr. Anitha Reddy', 'Dermatologist', 8, true, 4.70, 'https://images.unsplash.com/photo-1594824813573-246434de83fb?w=150'),
('dr.prasad@unimed.edu', '$2b$12$7kP2iZJ9iT.uG1eB21h1AeN4l3K6k.lS2dG3R1Y8.z79D2yD8zP0a', 'Dr. V. Prasad', 'Pediatrician', 12, false, 4.60, 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150');
