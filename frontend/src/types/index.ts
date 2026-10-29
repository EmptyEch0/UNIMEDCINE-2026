export interface UserDetails {
  id: number;
  email: string;
  full_name: string;
  program?: string;
  branch?: string;
  hostel?: string;
  medical_history?: string;
  emergency_contact?: string;
  blood_group?: string;
  allergies?: string;
  is_onboarded: boolean;
}

export interface DoctorDetails {
  id: number;
  email: string;
  full_name: string;
  specialization: string;
  experience: number;
  is_online: boolean;
  rating: number;
  photo_url?: string;
  qualification?: string;
  hospital?: string;
  working_hours?: string;
  languages?: string;
  bio?: string;
  max_appointments_per_day?: number;
}

export interface HealthNotice {
  id: number;
  title: string;
  content: string;
  category: 'Camp' | 'Vaccination' | 'Announcement';
  date: string;
}

export interface Hospital {
  id: number;
  name: string;
  type: 'Hospital' | 'Shop' | 'Clinic' | 'Diagnostics' | 'Ambulance';
  image_url?: string;
  rating: number;
  latitude: number;
  longitude: number;
  address: string;
  phone?: string;
  is_open: boolean;
}

export interface MedicineReminder {
  id: number;
  name: string;
  dose: string;
  time: string;
  repeat_days: string;
  is_active: boolean;
}

export interface MedicalRecord {
  id: number;
  user_id: number;
  title: string;
  file_url: string;
  record_type: 'PDF' | 'Prescription' | 'Blood Report' | 'Scan' | 'Consultation Summary';
  created_at: string;
}

export interface MessageReaction {
  id: number;
  message_id: number;
  sender_type: string;
  emoji: string;
  created_at: string;
}

export interface Message {
  id: number;
  chat_id: number;
  sender_type: 'patient' | 'doctor';
  content?: string;
  file_url?: string;
  file_name?: string;
  file_type?: string;
  reply_to_id?: number;
  is_pinned: boolean;
  is_read: boolean;
  created_at: string;
  reactions?: MessageReaction[];
}

export interface ChatSession {
  id: number;
  patient_anon_id: string;
  student_id: number;
  doctor_id: number;
  appointment_id?: number;
  is_active: boolean;
  created_at: string;
  messages: Message[];
  doctor?: DoctorDetails;
  student?: UserDetails;
}

export interface DoctorSlot {
  id: number;
  doctor_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'completed' | 'blocked' | 'vacation';
  appointment_id?: number;
  is_vacation: boolean;
  created_at: string;
}

export interface Appointment {
  id: number;
  student_id: number;
  doctor_id: number;
  slot_id?: number;
  appointment_date: string;
  status: 'scheduled' | 'accepted' | 'completed' | 'cancelled';
  reason?: string;
  created_at: string;
  doctor?: DoctorDetails;
  student?: UserDetails;
}

export interface Notification {
  id: number;
  recipient_type: string;
  recipient_id: number;
  title: string;
  message?: string;
  notif_type: string;
  is_read: boolean;
  created_at: string;
}

export interface ConsultationSummary {
  id: number;
  appointment_id: number;
  summary_json?: string;
  doctor_notes?: string;
  is_approved: boolean;
  approved_at?: string;
  created_at: string;
}

export interface PrescriptionMedicine {
  id: number;
  prescription_id: number;
  name: string;
  dosage?: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  days: number;
  instructions?: string;
}

export interface Prescription {
  id: number;
  appointment_id?: number;
  doctor_id: number;
  student_id: number;
  hospital_name?: string;
  doctor_signature?: string;
  notes?: string;
  pdf_url?: string;
  created_at: string;
  medicines: PrescriptionMedicine[];
  doctor?: DoctorDetails;
}

export interface PatientTimelineEvent {
  id: number;
  appointment_id?: number;
  student_id: number;
  event_type: string;
  description?: string;
  created_at: string;
}
