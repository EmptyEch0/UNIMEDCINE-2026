import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Plus, Trash2, Clock, CheckCircle, Lock, Sun, ChevronLeft, ChevronRight,
  Settings, AlertCircle, Zap, Edit3, X
} from 'lucide-react';

interface Slot {
  id: number;
  doctor_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'completed' | 'blocked' | 'vacation';
  is_vacation: boolean;
  appointment_id?: number;
}

const STATUS_CONFIG = {
  available:  { color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200/50', label: 'Available', Icon: CheckCircle },
  booked:     { color: '#2f7fc1', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200/50', label: 'Booked', Icon: Lock },
  completed:  { color: '#64748b', bg: 'bg-slate-50 dark:bg-slate-800/30', border: 'border-slate-200/30', label: 'Completed', Icon: CheckCircle },
  blocked:    { color: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/20', border: 'border-red-200/30', label: 'Blocked', Icon: AlertCircle },
  vacation:   { color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200/30', label: 'Vacation', Icon: Sun },
};

function getMonthDays(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function formatDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export default function DoctorAvailability() {
  const { token } = useStore();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [today] = useState(new Date());
  const [viewDate, setViewDate] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ start_hour: '09:00 AM', end_hour: '05:00 PM', duration_minutes: 15 });
  const [singleForm, setSingleForm] = useState({ start_time: '09:00 AM', end_time: '09:15 AM' });

  const API = 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => { fetchSlots(); }, []);

  async function fetchSlots() {
    setLoading(true);
    try {
      const res = await fetch(`${API}/slots`, { headers });
      const data = await res.json();
      if (Array.isArray(data)) setSlots(data);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function generateBulkSlots() {
    if (!selectedDate) return;
    setLoading(true);
    try {
      await fetch(`${API}/slots/generate`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slot_date: formatDate(selectedDate), ...bulkForm })
      });
      await fetchSlots();
      setShowBulkModal(false);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function addSingleSlot() {
    if (!selectedDate) return;
    setLoading(true);
    try {
      await fetch(`${API}/slots`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slot_date: formatDate(selectedDate), ...singleForm })
      });
      await fetchSlots();
      setShowAddModal(false);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function deleteSlot(slotId: number) {
    setLoading(true);
    try {
      await fetch(`${API}/slots/${slotId}`, { method: 'DELETE', headers });
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function blockDate() {
    if (!selectedDate) return;
    setLoading(true);
    try {
      await fetch(`${API}/slots/block`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slot_date: formatDate(selectedDate), reason: 'Blocked by doctor' })
      });
      await fetchSlots();
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function applyWeeklyTemplate(shiftType: 'morning' | 'evening') {
    setLoading(true);
    const startH = shiftType === 'morning' ? '10:00' : '16:00';
    const endH = shiftType === 'morning' ? '13:00' : '19:00';

    try {
      const dates: Date[] = [];
      const curr = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(curr);
        d.setDate(curr.getDate() + i);
        // Only Mon-Fri
        if (d.getDay() !== 0 && d.getDay() !== 6) {
          dates.push(d);
        }
      }

      for (const d of dates) {
        await fetch(`${API}/slots/bulk`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            slot_date: formatDate(d),
            start_hour: startH,
            end_hour: endH,
            duration_minutes: 20
          })
        });
      }

      await fetchSlots();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function markVacation() {
    if (!selectedDate) return;
    setLoading(true);
    try {
      await fetch(`${API}/slots/block`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ slot_date: formatDate(selectedDate), reason: 'Vacation', is_vacation: true })
      });
      await fetchSlots();
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const monthDays = getMonthDays(viewDate.getFullYear(), viewDate.getMonth());

  function getSlotsForDate(date: Date): Slot[] {
    const key = formatDate(date);
    return slots.filter(s => s.slot_date === key);
  }

  function getDateStatusColor(date: Date): string {
    const daySlots = getSlotsForDate(date);
    if (daySlots.length === 0) return '';
    if (daySlots.some(s => s.status === 'vacation')) return 'bg-amber-400/30';
    if (daySlots.some(s => s.status === 'blocked')) return 'bg-red-400/30';
    const available = daySlots.filter(s => s.status === 'available').length;
    const booked = daySlots.filter(s => s.status === 'booked').length;
    if (available === 0 && booked > 0) return 'bg-blue-400/30';
    return 'bg-emerald-400/20';
  }

  const selectedDateSlots = selectedDate ? getSlotsForDate(selectedDate) : [];
  const availableCount = selectedDateSlots.filter(s => s.status === 'available').length;
  const bookedCount = selectedDateSlots.filter(s => s.status === 'booked').length;

  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">

      {/* Header */}
      <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white font-poppins flex items-center gap-2 m-0">
            <Calendar className="w-6 h-6 text-[#2f7fc1]" /> Availability Manager
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage your consultation schedule, time slots, and recurring shifts.
          </p>
        </div>

        {/* Quick Weekly Templates */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => applyWeeklyTemplate('morning')}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 hover:shadow-lg transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            + Mon-Fri Morning Shift (10am-1pm)
          </button>
          <button
            onClick={() => applyWeeklyTemplate('evening')}
            className="px-3.5 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 hover:shadow-lg transition-all cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            + Mon-Fri Evening Shift (4pm-7pm)
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Calendar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-1">
          <div className="glass-card rounded-3xl p-5">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))}
                className="p-2 rounded-xl hover:bg-[#7cc8ff]/10 transition-colors">
                <ChevronLeft className="w-4 h-4 text-slate-500" />
              </button>
              <h3 className="text-sm font-extrabold text-slate-700 dark:text-white">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </h3>
              <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))}
                className="p-2 rounded-xl hover:bg-[#7cc8ff]/10 transition-colors">
                <ChevronRight className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
              {DAYS.map(d => (
                <div key={d} className="text-[10px] font-bold text-slate-400 text-center py-1">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {monthDays.map((day, idx) => {
                if (!day) return <div key={idx} />;
                const isSelected = selectedDate && formatDate(day) === formatDate(selectedDate);
                const isToday = formatDate(day) === formatDate(today);
                const statusColor = getDateStatusColor(day);
                const isPast = day < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedDate(day)}
                    disabled={isPast}
                    className={`
                      aspect-square text-xs font-bold rounded-xl transition-all relative overflow-hidden
                      ${isPast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#7cc8ff]/20 cursor-pointer'}
                      ${isSelected ? 'bg-[#2f7fc1] text-white shadow-md' : 'text-slate-700 dark:text-slate-200'}
                      ${isToday && !isSelected ? 'ring-2 ring-[#2f7fc1] ring-offset-1' : ''}
                      ${statusColor && !isSelected ? statusColor : ''}
                    `}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 gap-1.5">
              {[
                { color: 'bg-emerald-400/30', label: 'Available' },
                { color: 'bg-blue-400/30', label: 'Booked' },
                { color: 'bg-red-400/30', label: 'Blocked' },
                { color: 'bg-amber-400/30', label: 'Vacation' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className={`w-3 h-3 rounded-full ${l.color}`} />
                  <span className="text-[10px] text-slate-400">{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Slot Manager Panel */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-2">
          <div className="glass-card rounded-3xl p-6 h-full">
            {!selectedDate ? (
              <div className="flex flex-col items-center justify-center h-full min-h-48 text-slate-400">
                <Calendar className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm font-medium">Select a date to manage slots</p>
              </div>
            ) : (
              <>
                {/* Date header */}
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-800 dark:text-white font-poppins">
                      {selectedDate.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </h2>
                    <div className="flex gap-3 mt-1">
                      <span className="text-xs text-emerald-600 font-bold">{availableCount} available</span>
                      <span className="text-xs text-blue-600 font-bold">{bookedCount} booked</span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap justify-end">
                    <button onClick={() => setShowBulkModal(true)}
                      className="px-3 py-2 bg-[#2f7fc1] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#1f5b8c] transition-all">
                      <Zap className="w-3.5 h-3.5" /> Auto-Generate
                    </button>
                    <button onClick={() => setShowAddModal(true)}
                      className="px-3 py-2 glass-card border border-[#7cc8ff]/30 text-[#2f7fc1] text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-[#7cc8ff]/10 transition-all">
                      <Plus className="w-3.5 h-3.5" /> Add Slot
                    </button>
                    <button onClick={blockDate}
                      className="px-3 py-2 glass-card border border-red-300/30 text-red-500 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all">
                      <AlertCircle className="w-3.5 h-3.5" /> Block Day
                    </button>
                    <button onClick={markVacation}
                      className="px-3 py-2 glass-card border border-amber-300/30 text-amber-600 text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all">
                      <Sun className="w-3.5 h-3.5" /> Vacation
                    </button>
                  </div>
                </div>

                {/* Slot list */}
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <div key={i} className="h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse" />
                    ))
                  ) : selectedDateSlots.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                      <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No slots for this day. Add slots or auto-generate.</p>
                    </div>
                  ) : (
                    <AnimatePresence>
                      {selectedDateSlots.map((slot, i) => {
                        const cfg = STATUS_CONFIG[slot.status] || STATUS_CONFIG.available;
                        const Icon = cfg.Icon;
                        return (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ delay: i * 0.03 }}
                            className={`flex items-center justify-between p-4 rounded-2xl border ${cfg.bg} ${cfg.border} transition-all`}
                          >
                            <div className="flex items-center gap-3">
                              <Icon className="w-4 h-4 flex-shrink-0" style={{ color: cfg.color }} />
                              <div>
                                <p className="text-sm font-bold text-slate-700 dark:text-white">
                                  {slot.start_time} — {slot.end_time}
                                </p>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                                  style={{ background: `${cfg.color}20`, color: cfg.color }}>
                                  {cfg.label}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {slot.status === 'available' && (
                                <button
                                  onClick={() => deleteSlot(slot.id)}
                                  className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 hover:text-red-600 transition-all"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {slot.status === 'booked' && slot.appointment_id && (
                                <span className="text-[10px] text-blue-500 font-bold">Appt #{slot.appointment_id}</span>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* Bulk Generate Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-3xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Auto-Generate Slots</h3>
                <button onClick={() => setShowBulkModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4">
                For {selectedDate?.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Start Time</label>
                  <input type="text" value={bulkForm.start_hour}
                    onChange={e => setBulkForm(f => ({ ...f, start_hour: e.target.value }))}
                    placeholder="09:00 AM"
                    className="w-full px-4 py-2.5 glass-card rounded-xl text-sm font-medium border border-[#7cc8ff]/20 focus:border-[#2f7fc1]/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">End Time</label>
                  <input type="text" value={bulkForm.end_hour}
                    onChange={e => setBulkForm(f => ({ ...f, end_hour: e.target.value }))}
                    placeholder="05:00 PM"
                    className="w-full px-4 py-2.5 glass-card rounded-xl text-sm font-medium border border-[#7cc8ff]/20 focus:border-[#2f7fc1]/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Slot Duration (minutes)</label>
                  <select value={bulkForm.duration_minutes}
                    onChange={e => setBulkForm(f => ({ ...f, duration_minutes: Number(e.target.value) }))}
                    className="w-full px-4 py-2.5 glass-card rounded-xl text-sm font-medium border border-[#7cc8ff]/20 focus:border-[#2f7fc1]/50 outline-none">
                    {[10, 15, 20, 30, 45, 60].map(d => (
                      <option key={d} value={d}>{d} minutes</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowBulkModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                  Cancel
                </button>
                <button onClick={generateBulkSlots} disabled={loading}
                  className="flex-1 py-3 bg-[#2f7fc1] hover:bg-[#1f5b8c] text-white font-bold text-sm rounded-2xl shadow-md transition-all disabled:opacity-50">
                  {loading ? 'Generating...' : 'Generate Slots'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Single Slot Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card rounded-3xl p-6 w-full max-w-sm">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Add Single Slot</h3>
                <button onClick={() => setShowAddModal(false)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Start Time (e.g. 02:00 PM)</label>
                  <input type="text" value={singleForm.start_time}
                    onChange={e => setSingleForm(f => ({ ...f, start_time: e.target.value }))}
                    className="w-full px-4 py-2.5 glass-card rounded-xl text-sm font-medium border border-[#7cc8ff]/20 focus:border-[#2f7fc1]/50 outline-none" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1.5">End Time (e.g. 02:15 PM)</label>
                  <input type="text" value={singleForm.end_time}
                    onChange={e => setSingleForm(f => ({ ...f, end_time: e.target.value }))}
                    className="w-full px-4 py-2.5 glass-card rounded-xl text-sm font-medium border border-[#7cc8ff]/20 focus:border-[#2f7fc1]/50 outline-none" />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-slate-500 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-900 transition-all">
                  Cancel
                </button>
                <button onClick={addSingleSlot} disabled={loading}
                  className="flex-1 py-3 bg-[#2f7fc1] hover:bg-[#1f5b8c] text-white font-bold text-sm rounded-2xl shadow-md transition-all disabled:opacity-50">
                  {loading ? 'Adding...' : 'Add Slot'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
