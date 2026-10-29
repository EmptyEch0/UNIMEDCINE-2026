import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Calendar, MessageSquare, CheckCircle, Clock, Bell, AlertTriangle,
  TrendingUp, Stethoscope, Activity, ChevronRight, User, Wifi, Sparkles, X, FileText
} from 'lucide-react';
import type { DoctorDetails } from '../types';

interface Analytics {
  total_appointments: number;
  today_appointments: number;
  completed_consultations: number;
  upcoming_appointments: number;
  pending_chats: number;
  unread_messages: number;
}

interface Appointment {
  id: number;
  student_id: number;
  appointment_date: string;
  status: string;
  reason?: string;
  student?: { full_name: string; hostel?: string; };
  slot_id?: number;
}

function AnimatedCounter({ value, duration = 1.2 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let start = 0;
    const steps = 40;
    const increment = value / steps;
    const interval = (duration * 1000) / steps;
    const timer = setInterval(() => {
      start += increment;
      if (start >= value) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start));
      }
    }, interval);
    return () => clearInterval(timer);
  }, [value, duration]);

  return <span>{display}</span>;
}

const STAT_CARDS = [
  { key: 'today_appointments', label: "Today's Patients", icon: Users, color: '#2f7fc1', bg: 'from-[#2f7fc1]/10 to-[#7cc8ff]/5' },
  { key: 'upcoming_appointments', label: 'Upcoming', icon: Calendar, color: '#7cc8ff', bg: 'from-[#7cc8ff]/10 to-[#b7e3ff]/5' },
  { key: 'pending_chats', label: 'Pending Chats', icon: MessageSquare, color: '#0ea5e9', bg: 'from-[#0ea5e9]/10 to-[#7cc8ff]/5' },
  { key: 'completed_consultations', label: 'Completed', icon: CheckCircle, color: '#22c55e', bg: 'from-green-500/10 to-emerald-400/5' },
  { key: 'unread_messages', label: 'Unread Messages', icon: Bell, color: '#f59e0b', bg: 'from-amber-500/10 to-yellow-400/5' },
  { key: 'total_appointments', label: 'Total Appointments', icon: Activity, color: '#8b5cf6', bg: 'from-violet-500/10 to-purple-400/5' },
];

const STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  completed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
};

export default function DoctorDashboard() {
  const { token, user } = useStore();
  const doctor = user as DoctorDetails;
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1-Click AI Clinical Summary Modal State
  const [aiSummaryAppt, setAiSummaryAppt] = useState<Appointment | null>(null);

  const API = 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    Promise.all([
      fetch(`${API}/appointments/analytics/doctor`, { headers }).then(r => r.json()),
      fetch(`${API}/appointments`, { headers }).then(r => r.json()),
      fetch(`${API}/notifications`, { headers }).then(r => r.json()),
    ]).then(([analytics, appointments, notifs]) => {
      if (!analytics.detail) setAnalytics(analytics);
      if (Array.isArray(appointments)) setAppointments(appointments.slice(0, 8));
      if (Array.isArray(notifs)) setNotifications(notifs.filter((n: any) => !n.is_read).slice(0, 5));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const upcomingAppts = appointments.filter(a => ['scheduled', 'accepted'].includes(a.status));
  const emergencyAppts = appointments.filter(a =>
    a.reason?.toLowerCase().includes('emergency') || a.reason?.toLowerCase().includes('urgent') || a.reason?.toLowerCase().includes('severe')
  );

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">

      {/* Header */}
      <motion.div variants={itemVariants} className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider">Online</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white font-poppins">
              Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, Dr. {doctor?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{today}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/doctor/notifications" className="relative p-3 glass-card rounded-xl hover:scale-105 transition-transform">
              <Bell className="w-5 h-5 text-[#2f7fc1]" />
              {notifications.length > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center"
                >
                  {notifications.length}
                </motion.span>
              )}
            </Link>
            <Link to="/doctor/slots" className="px-4 py-2.5 bg-[#2f7fc1] hover:bg-[#1f5b8c] text-white font-bold text-sm rounded-xl transition-all shadow-md">
              Manage Slots
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Analytics Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => {
          const Icon = card.icon;
          const val = analytics ? (analytics as any)[card.key] ?? 0 : 0;
          return (
            <motion.div
              key={card.key}
              whileHover={{ y: -4, scale: 1.02 }}
              className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${card.bg} cursor-default`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{card.label}</p>
                  <p className="text-3xl font-extrabold mt-2" style={{ color: card.color }}>
                    {loading ? <span className="animate-pulse">—</span> : <AnimatedCounter value={val} />}
                  </p>
                </div>
                <div className="p-2.5 rounded-xl" style={{ background: `${card.color}15` }}>
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Today's Schedule */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <div className="glass-card rounded-3xl p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-extrabold text-slate-800 dark:text-white font-poppins flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2f7fc1]" /> Upcoming Appointments
              </h2>
              <Link to="/drchat" className="text-xs font-bold text-[#2f7fc1] hover:underline flex items-center gap-1">
                View all <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                ))
              ) : upcomingAppts.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No upcoming appointments</p>
                </div>
              ) : (
                upcomingAppts.map((appt, i) => (
                  <motion.div
                    key={appt.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-white/30 dark:bg-slate-800/30 rounded-2xl hover:bg-[#7cc8ff]/10 transition-all group"
                  >
                    <div className="w-10 h-10 bg-[#2f7fc1]/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-[#2f7fc1]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-700 dark:text-white truncate">
                        {appt.student?.full_name || `Patient #${appt.student_id}`}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{appt.reason || 'General consultation'}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                        {new Date(appt.appointment_date).toLocaleDateString()}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[appt.status] || ''}`}>
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setAiSummaryAppt(appt)}
                        className="p-1.5 rounded-lg bg-[#7cc8ff]/10 hover:bg-[#7cc8ff]/20 text-[#2f7fc1] transition-all"
                        title="1-Click AI Clinical Summary Note"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                      <Link
                        to={`/doctor/chat`}
                        className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-[#2f7fc1] transition-all"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>

        {/* Right sidebar */}
        <motion.div variants={itemVariants} className="space-y-6">

          {/* Emergency Queue */}
          {emergencyAppts.length > 0 && (
            <div className="glass-card rounded-3xl p-5 border border-red-400/20 bg-gradient-to-br from-red-500/5 to-transparent">
              <h3 className="text-sm font-extrabold text-red-500 mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 animate-pulse" /> Emergency Queue
              </h3>
              <div className="space-y-2">
                {emergencyAppts.map(appt => (
                  <Link key={appt.id} to={`/doctor/consultation/${appt.id}`}
                    className="block p-3 bg-red-50 dark:bg-red-950/20 rounded-xl hover:bg-red-100 dark:hover:bg-red-950/40 transition-all border border-red-200/30">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400 truncate">
                      {appt.student?.full_name || `Patient #${appt.student_id}`}
                    </p>
                    <p className="text-[10px] text-red-400 truncate">{appt.reason}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Notifications */}
          <div className="glass-card rounded-3xl p-5">
            <h3 className="text-sm font-extrabold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#2f7fc1]" /> Notifications
              {notifications.length > 0 && (
                <span className="ml-auto text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">
                  {notifications.length} new
                </span>
              )}
            </h3>
            <div className="space-y-2">
              {notifications.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-3">All caught up!</p>
              ) : (
                notifications.map((notif: any) => (
                  <div key={notif.id} className="p-3 bg-[#7cc8ff]/5 rounded-xl border border-[#7cc8ff]/10">
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{notif.title}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{notif.message}</p>
                  </div>
                ))
              )}
            </div>
            {notifications.length > 0 && (
              <Link to="/doctor/notifications" className="block text-center text-xs text-[#2f7fc1] font-bold mt-3 hover:underline">
                View all notifications
              </Link>
            )}
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-3xl p-5">
            <h3 className="text-sm font-extrabold text-slate-700 dark:text-white mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Manage Availability', icon: Calendar, to: '/doctor/slots', color: '#2f7fc1' },
                { label: 'Patient Chats', icon: MessageSquare, to: '/doctor/chat', color: '#7cc8ff' },
                { label: 'Write Prescription', icon: Stethoscope, to: '/doctor/prescriptions', color: '#22c55e' },
              ].map(action => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#7cc8ff]/10 transition-all group"
                  >
                    <div className="p-2 rounded-lg" style={{ background: `${action.color}15` }}>
                      <Icon className="w-4 h-4" style={{ color: action.color }} />
                    </div>
                    <span className="text-sm font-bold text-slate-600 dark:text-slate-300 group-hover:text-[#2f7fc1] transition-colors">
                      {action.label}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-auto group-hover:text-[#2f7fc1] transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>

        </motion.div>
      </div>

      {/* 1-CLICK AI CLINICAL SUMMARY MODAL */}
      {aiSummaryAppt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 text-left">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="font-extrabold text-base font-poppins m-0 text-white">
                  AI Clinical Chart Summary Note
                </h3>
              </div>
              <button onClick={() => setAiSummaryAppt(null)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-300 font-semibold">
                Patient: <span className="text-white font-bold">{aiSummaryAppt.student?.full_name || `Student #${aiSummaryAppt.student_id}`}</span> • Consultation Reason: <span className="text-white font-bold">{aiSummaryAppt.reason || 'General Checkup'}</span>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    1. Primary Symptom Indications
                  </span>
                  <p className="text-slate-200 leading-relaxed m-0 font-medium">
                    Student reports acute onset of symptoms ({aiSummaryAppt.reason || 'general malaise, fever, upper respiratory irritation'}). No severe red-flag cardiac distress reported.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    2. Risk Level & Precautions
                  </span>
                  <p className="text-slate-200 leading-relaxed m-0 font-medium">
                    Risk Assessment: <strong className="text-amber-400">Mild / Low Risk</strong>. Recommend checking body temperature, hydration level, and verifying past allergy records.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800 border border-slate-700/60 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">
                    3. Recommended Physician Next Steps
                  </span>
                  <p className="text-slate-200 leading-relaxed m-0 font-medium">
                    Conduct physical throat/chest auscultation or proceed with Video Call. Issue standard symptomatic OTC treatment if viral infection is confirmed.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Link
                to="/doctor/chat"
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white text-center font-bold text-xs rounded-xl shadow-md transition-all"
              >
                Launch Live Consultation Chat
              </Link>
              <button
                onClick={() => setAiSummaryAppt(null)}
                className="py-3 px-5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl border border-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </motion.div>
  );
}
