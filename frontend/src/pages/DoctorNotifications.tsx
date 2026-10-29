import { useEffect, useState } from 'react';
import { useStore } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, CheckCheck, Trash2, Calendar, MessageSquare, AlertTriangle, Info, X } from 'lucide-react';

interface Notification {
  id: number;
  title: string;
  message?: string;
  notif_type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string; bg: string }> = {
  appointment: { icon: Calendar, color: '#2f7fc1', bg: 'bg-blue-50 dark:bg-blue-950/20' },
  chat: { icon: MessageSquare, color: '#22c55e', bg: 'bg-emerald-50 dark:bg-emerald-950/20' },
  sos: { icon: AlertTriangle, color: '#ef4444', bg: 'bg-red-50 dark:bg-red-950/20' },
  general: { icon: Info, color: '#7cc8ff', bg: 'bg-[#7cc8ff]/10' },
  reminder: { icon: Bell, color: '#f59e0b', bg: 'bg-amber-50 dark:bg-amber-950/20' },
};

type FilterTab = 'all' | 'appointment' | 'chat' | 'sos';

export default function DoctorNotifications() {
  const { token } = useStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');

  const API = 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch(`${API}/notifications`, { headers })
      .then(r => r.json())
      .then(d => Array.isArray(d) && setNotifications(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  async function markRead(id: number) {
    await fetch(`${API}/notifications/${id}/read`, { method: 'PATCH', headers });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  async function markAllRead() {
    await fetch(`${API}/notifications/read-all`, { method: 'PATCH', headers });
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  }

  async function deleteNotif(id: number) {
    await fetch(`${API}/notifications/${id}`, { method: 'DELETE', headers });
    setNotifications(prev => prev.filter(n => n.id !== id));
  }

  const filtered = filter === 'all' ? notifications : notifications.filter(n => n.notif_type === filter);
  const unread = notifications.filter(n => !n.is_read).length;

  const TABS: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'appointment', label: 'Appointments' },
    { id: 'chat', label: 'Messages' },
    { id: 'sos', label: 'SOS' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white font-poppins flex items-center gap-2">
              <Bell className="w-6 h-6 text-[#2f7fc1]" /> Notifications
              {unread > 0 && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="w-7 h-7 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {unread}
                </motion.span>
              )}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Stay updated on appointments, messages, and alerts</p>
          </div>
          {unread > 0 && (
            <button onClick={markAllRead}
              className="px-4 py-2 glass-card border border-[#7cc8ff]/20 text-[#2f7fc1] text-sm font-bold rounded-xl hover:bg-[#7cc8ff]/10 transition-all flex items-center gap-2">
              <CheckCheck className="w-4 h-4" /> Mark All Read
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="glass-card rounded-2xl p-1.5 flex gap-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setFilter(tab.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
              filter === tab.id
                ? 'bg-[#2f7fc1] text-white shadow-md'
                : 'text-slate-500 dark:text-slate-400 hover:text-[#2f7fc1] hover:bg-[#7cc8ff]/10'
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {loading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-20 glass-card rounded-2xl animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((notif, i) => {
              const cfg = TYPE_CONFIG[notif.notif_type] || TYPE_CONFIG.general;
              const Icon = cfg.icon;
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20, height: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`glass-card rounded-2xl p-4 flex items-start gap-4 transition-all ${
                    !notif.is_read ? 'border-l-4 border-[#2f7fc1]' : 'opacity-70'
                  }`}
                >
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${cfg.bg}`}>
                    <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-bold ${notif.is_read ? 'text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                        {notif.title}
                      </p>
                      {!notif.is_read && (
                        <div className="w-2 h-2 rounded-full bg-[#2f7fc1] flex-shrink-0 mt-1.5" />
                      )}
                    </div>
                    {notif.message && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{notif.message}</p>
                    )}
                    <p className="text-[10px] text-slate-400 mt-1.5">
                      {new Date(notif.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!notif.is_read && (
                      <button onClick={() => markRead(notif.id)}
                        className="p-1.5 rounded-lg hover:bg-[#7cc8ff]/10 text-[#2f7fc1] transition-colors" title="Mark as read">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => deleteNotif(notif.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-400 transition-colors" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
