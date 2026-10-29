import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store/store';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Calendar, Search, Send, Paperclip, Phone, Video, VideoOff,
  MicOff, Mic, PhoneOff, Star, Clock, CheckCheck, Check, X, ChevronRight,
  Users, User, Shield, AlertCircle, Plus, FileText, Image, Download, Smile,
  CornerUpLeft, Pin, Hash, Loader2
} from 'lucide-react';
import type { DoctorDetails, ChatSession, Message } from '../types';

import VideoCallModal from '../components/VideoCallModal';

interface Slot { id: number; slot_date: string; start_time: string; end_time: string; status: string; }
interface Appointment { id: number; appointment_date: string; status: string; reason?: string; doctor?: DoctorDetails; slot_id?: number; }

type Tab = 'book' | 'chats' | 'appointments';

// ─── Helper Components ─────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4">
      <div className="flex gap-1 p-3 glass-card rounded-2xl rounded-bl-sm">
        {[0, 1, 2].map(i => (
          <motion.div key={i} className="w-2 h-2 bg-[#7cc8ff] rounded-full"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }} />
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ msg, onReply }: { msg: Message; onReply?: (msg: Message) => void }) {
  const isDoctor = msg.sender_type === 'doctor';
  const [showActions, setShowActions] = useState(false);
  const isImage = msg.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);

  return (
    <div className={`flex ${isDoctor ? 'justify-start' : 'justify-end'} group`}
      onMouseEnter={() => setShowActions(true)} onMouseLeave={() => setShowActions(false)}>
      <div className="max-w-[75%] space-y-1">
        {msg.content && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed relative ${
            isDoctor
              ? 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-white rounded-bl-sm shadow-sm border border-white/40'
              : 'bg-gradient-to-br from-[#2f7fc1] to-[#1f5b8c] text-white rounded-br-sm shadow-md'
          }`}>
            {msg.content}
            <div className={`flex items-center gap-1 mt-1 ${isDoctor ? 'justify-start' : 'justify-end'}`}>
              <span className="text-[10px] opacity-60">
                {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
              {!isDoctor && (
                msg.is_read
                  ? <CheckCheck className="w-3 h-3 text-white" />
                  : <Check className="w-3 h-3 opacity-60" />
              )}
            </div>
          </div>
        )}
        {msg.file_url && (
          isImage ? (
            <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md max-w-sm">
              <a href={`http://localhost:8000${msg.file_url}`} target="_blank" rel="noopener noreferrer">
                <img src={`http://localhost:8000${msg.file_url}`} alt="Attachment" className="w-full max-h-60 object-cover hover:scale-105 transition-transform duration-300" />
              </a>
            </div>
          ) : (
            <a href={`http://localhost:8000${msg.file_url}`} target="_blank" rel="noopener noreferrer"
              className={`flex items-center gap-3 p-3.5 rounded-2xl text-sm transition-all shadow-sm ${
                isDoctor ? 'glass-card border border-white/20 hover:bg-white/40' : 'bg-[#2f7fc1]/90 text-white hover:bg-[#2f7fc1]'
              }`}>
              <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-xs font-bold">{msg.file_name || 'Medical Document.pdf'}</p>
                <span className="text-[10px] opacity-75 uppercase font-mono font-semibold">Attached File</span>
              </div>
              <Download className="w-4 h-4 flex-shrink-0 opacity-80" />
            </a>
          )
        )}
      </div>
      {showActions && onReply && (
        <button onClick={() => onReply(msg)} className="mx-2 p-1.5 rounded-lg hover:bg-[#F2EDE4] transition-colors opacity-70 hover:opacity-100 self-center">
          <CornerUpLeft className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
}

// ─── Book Tab ─────────────────────────────────────────────────────────────

function BookTab({ token }: { token: string | null }) {
  const [doctors, setDoctors] = useState<DoctorDetails[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorDetails | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [booked, setBooked] = useState(false);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  const API = 'http://localhost:8000/api';

  useEffect(() => {
    fetch(`${API}/doctors`, { headers }).then(r => r.json()).then(d => Array.isArray(d) && setDoctors(d)).catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedDoctor) { setSlots([]); return; }
    fetch(`${API}/slots/doctor/${selectedDoctor.id}`, { headers }).then(r => r.json()).then(d => Array.isArray(d) && setSlots(d)).catch(console.error);
  }, [selectedDoctor]);

  async function bookAppointment() {
    if (!selectedDoctor || !selectedSlot || !reason.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API}/appointments`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          doctor_id: selectedDoctor.id,
          slot_id: selectedSlot.id,
          appointment_date: `${selectedSlot.slot_date}T${selectedSlot.start_time.replace(' AM', '').replace(' PM', ':00')}`,
          reason
        })
      });
      if (res.ok) {
        setBooked(true);
        setSlots(prev => prev.filter(s => s.id !== selectedSlot.id));
        setSelectedSlot(null);
        setTimeout(() => setBooked(false), 3000);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  const filtered = doctors.filter(d =>
    d.full_name.toLowerCase().includes(search.toLowerCase()) ||
    d.specialization.toLowerCase().includes(search.toLowerCase())
  );

  const groupedSlots: Record<string, Slot[]> = {};
  slots.forEach(s => {
    if (!groupedSlots[s.slot_date]) groupedSlots[s.slot_date] = [];
    groupedSlots[s.slot_date].push(s);
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6 h-full">
      {/* Doctor Selection */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search doctors..."
            className="w-full pl-10 pr-4 py-3 glass-card rounded-2xl text-sm border border-[#7cc8ff]/20 focus:border-[#2f7fc1]/50 outline-none" />
        </div>
        <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
          {filtered.map(doc => (
            <motion.button
              key={doc.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => { setSelectedDoctor(doc); setSelectedSlot(null); }}
              className={`w-full text-left p-4 glass-card rounded-2xl transition-all border ${
                selectedDoctor?.id === doc.id
                  ? 'border-[#2C2C2E]/30 bg-[#F2EDE4]/70 shadow-sm'
                  : 'border-transparent hover:border-[#E5E1DA]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={doc.photo_url || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=80'}
                    alt={doc.full_name} className="w-12 h-12 rounded-2xl object-cover" />
                  <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${doc.is_online ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-slate-800 dark:text-white text-sm">{doc.full_name}</p>
                  <p className="text-xs text-[#6E6E73] font-semibold">{doc.specialization}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                    <span className="text-xs text-slate-500">{doc.rating?.toFixed(1)} • {doc.experience}y exp</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${doc.is_online ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-500'}`}>
                      {doc.is_online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                </div>
                {selectedDoctor?.id === doc.id && <ChevronRight className="w-4 h-4 text-[#2C2C2E]" />}
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Slot Picker + Booking */}
      <div className="space-y-4">
        {!selectedDoctor ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a doctor to view available slots</p>
            </div>
          </div>
        ) : slots.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No available slots for Dr. {selectedDoctor.full_name}</p>
              <p className="text-xs mt-1 text-slate-300">Check back later</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
            <h3 className="text-sm font-extrabold text-slate-700 dark:text-white sticky top-0 bg-transparent">
              Available Slots — Dr. {selectedDoctor.full_name}
            </h3>
            {Object.entries(groupedSlots).map(([date, daySlots]) => (
              <div key={date}>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  {new Date(date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {daySlots.map(slot => (
                    <motion.button
                      key={slot.id}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-3 rounded-xl text-xs font-bold border transition-all ${
                        selectedSlot?.id === slot.id
                          ? 'bg-[#2C2C2E] text-white border-[#2C2C2E] shadow-sm'
                          : 'glass-card border-[#E5E1DA] text-slate-600 dark:text-slate-350 hover:border-[#2C2C2E]/45'
                      }`}
                    >
                      {slot.start_time} - {slot.end_time}
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
            {selectedSlot && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="pt-4 border-t border-[#E5E1DA] space-y-3">
                <div className="p-3 bg-[#F2EDE4]/70 rounded-xl text-xs">
                  <p className="font-bold text-[#1D1D1F]">Selected Slot</p>
                  <p className="text-slate-600 dark:text-slate-350">{new Date(selectedSlot.slot_date).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} • {selectedSlot.start_time} – {selectedSlot.end_time}</p>
                </div>
                <textarea value={reason} onChange={e => setReason(e.target.value)}
                  placeholder="Reason for consultation (required)..."
                  rows={3}
                  className="w-full px-4 py-3 glass-card rounded-2xl text-sm border border-[#E5E1DA] focus:border-[#2C2C2E]/50 outline-none resize-none" />
                <motion.button
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={bookAppointment}
                  disabled={loading || !reason.trim()}
                  className="w-full py-3.5 bg-[#2C2C2E] text-white font-semibold rounded-2xl shadow-sm text-sm disabled:opacity-50 flex items-center justify-center gap-2 hover:bg-[#1D1D1F]"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                  {loading ? 'Booking...' : 'Confirm Appointment'}
                </motion.button>
              </motion.div>
            )}
          </div>
        )}

        <AnimatePresence>
          {booked && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200/30 rounded-2xl text-center">
              <CheckCheck className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">Appointment Booked!</p>
              <p className="text-xs text-emerald-500 mt-1">Doctor has been notified</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Chat Tab ─────────────────────────────────────────────────────────────

function ChatTab({ token }: { token: string | null }) {
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const [search, setSearch] = useState('');
  const [uploading, setUploading] = useState(false);
  const [callModalOpen, setCallModalOpen] = useState(false);
  const [callType, setCallType] = useState<'video' | 'voice'>('video');
  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const headers = { Authorization: `Bearer ${token}` };
  const API = 'http://localhost:8000/api';
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API}/chats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => Array.isArray(d) && setChatSessions(d)).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:8000/api/chats/ws/${token}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      if (payload.type === 'chat_message') {
        setMessages(prev => prev.some(m => m.id === payload.id) ? prev : [...prev, payload]);
      } else if (payload.type === 'typing') {
        setPartnerTyping(payload.is_typing);
        if (payload.is_typing) {
          setTimeout(() => setPartnerTyping(false), 3000);
        }
      }
    };
    return () => ws.close();
  }, [token]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, partnerTyping]);

  async function openChat(session: ChatSession) {
    setActiveChat(session);
    const res = await fetch(`${API}/chats/${session.id}/messages`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setMessages(Array.isArray(data) ? data : []);
  }

  function sendTyping(isTyping: boolean) {
    if (wsRef.current?.readyState === WebSocket.OPEN && activeChat) {
      wsRef.current.send(JSON.stringify({ type: 'typing', chat_id: activeChat.id, is_typing: isTyping }));
    }
  }

  async function sendMessage() {
    if (!inputText.trim() || !activeChat) return;
    const content = inputText.trim();
    setInputText('');
    setReplyTo(null);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        chat_id: activeChat.id,
        content,
        reply_to_id: replyTo?.id
      }));
    }
  }

  async function handleFileUpload(file: File) {
    if (!activeChat || !token) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('title', file.name);
    fd.append('record_type', file.type.includes('pdf') ? 'PDF' : 'Scan');
    try {
      const res = await fetch(`${API}/records`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
      const data = await res.json();
      if (data.file_url && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          chat_id: activeChat.id,
          content: null,
          file_url: data.file_url,
          file_name: file.name,
          file_type: file.type
        }));
      }
    } catch (e) { console.error(e); }
    setUploading(false);
  }

  const filteredSessions = chatSessions.filter(s =>
    s.doctor?.full_name?.toLowerCase().includes(search.toLowerCase()) || true
  );

  return (
    <div className="grid lg:grid-cols-3 gap-0 h-[560px] glass-card rounded-3xl overflow-hidden">
      {/* Chat List */}
      <div className="lg:col-span-1 border-r border-white/10 dark:border-slate-800/50 flex flex-col">
        <div className="p-4 border-b border-white/10 dark:border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chats..."
              className="w-full pl-9 pr-3 py-2 bg-white/10 dark:bg-slate-800/30 rounded-xl text-xs border border-transparent focus:border-[#7cc8ff]/30 outline-none" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No conversations yet</p>
            </div>
          ) : filteredSessions.map(session => (
            <button key={session.id} onClick={() => openChat(session)}
              className={`w-full text-left px-4 py-4 hover:bg-[#7cc8ff]/5 transition-colors border-b border-white/5 ${activeChat?.id === session.id ? 'bg-[#7cc8ff]/10' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img src={session.doctor?.photo_url || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=60'}
                    className="w-10 h-10 rounded-full object-cover" alt="Doctor" />
                  {session.doctor?.is_online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 dark:text-white truncate">
                    {session.doctor?.full_name || 'Doctor'}
                  </p>
                  <p className="text-xs text-[#2f7fc1] truncate">{session.doctor?.specialization}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{session.patient_anon_id}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className="lg:col-span-2 flex flex-col">
        {!activeChat ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/10 dark:border-slate-800/50 flex items-center gap-3">
              <img src={activeChat.doctor?.photo_url || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=60'}
                className="w-9 h-9 rounded-full object-cover" alt="Doctor" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-700 dark:text-white">{activeChat.doctor?.full_name}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#A89A88]" /> Anonymous ID: {activeChat.patient_anon_id}
                </p>
              </div>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => { setCallType('voice'); setCallModalOpen(true); }}
                  className="p-2 rounded-xl hover:bg-[#F2EDE4] text-[#2C2C2E] transition-colors animate-btn cursor-pointer" 
                  title="Voice Call"
                >
                  <Phone className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => { setCallType('video'); setCallModalOpen(true); }}
                  className="p-2 rounded-xl hover:bg-[#F2EDE4] text-[#2C2C2E] transition-colors animate-btn cursor-pointer" 
                  title="Video Call"
                >
                  <Video className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map(msg => (
                <MessageBubble key={msg.id} msg={msg} onReply={setReplyTo} />
              ))}
              {partnerTyping && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Banner */}
            <AnimatePresence>
              {replyTo && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-2 bg-[#7cc8ff]/10 border-t border-[#7cc8ff]/20 flex items-center gap-2">
                  <CornerUpLeft className="w-3.5 h-3.5 text-[#2f7fc1] flex-shrink-0" />
                  <p className="text-xs text-slate-600 dark:text-slate-400 flex-1 truncate">{replyTo.content}</p>
                  <button onClick={() => setReplyTo(null)} className="p-1 hover:bg-white/20 rounded-lg">
                    <X className="w-3 h-3 text-slate-400" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Input */}
            <div className="p-4 border-t border-white/10 dark:border-slate-800/50">
              <div className="flex items-end gap-2">
                <div className="flex-1 glass-card rounded-2xl border border-[#E5E1DA] flex items-end">
                  <textarea
                    value={inputText}
                    onChange={e => {
                      setInputText(e.target.value);
                      sendTyping(true);
                      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
                      typingTimerRef.current = setTimeout(() => sendTyping(false), 2000);
                    }}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 bg-transparent px-4 py-3 text-sm outline-none resize-none"
                  />
                  <div className="flex items-center gap-1 px-2 pb-2">
                    <button onClick={() => fileInputRef.current?.click()}
                      className="p-1.5 rounded-lg hover:bg-[#F2EDE4] text-slate-400 hover:text-[#2C2C2E] transition-colors" title="Attach file">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*,.pdf,.doc,.docx" className="hidden"
                      onChange={e => e.target.files?.[0] && handleFileUpload(e.target.files[0])} />
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  onClick={sendMessage}
                  disabled={!inputText.trim()}
                  className="p-3.5 bg-[#2C2C2E] text-white rounded-2xl shadow-sm hover:bg-[#1D1D1F] transition-all disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            {/* WebRTC Video Call Modal */}
            <VideoCallModal
              isOpen={callModalOpen}
              onClose={() => setCallModalOpen(false)}
              partnerName={activeChat.doctor?.full_name || 'Campus Doctor'}
              partnerRole={activeChat.doctor?.specialization || 'Medical Specialist'}
              partnerPhoto={activeChat.doctor?.photo_url}
              callType={callType}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Appointments Tab ─────────────────────────────────────────────────────

function AppointmentsTab({ token }: { token: string | null }) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    fetch('http://localhost:8000/api/appointments', { headers })
      .then(r => r.json()).then(d => Array.isArray(d) && setAppointments(d)).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  async function cancelAppointment(id: number) {
    await fetch(`http://localhost:8000/api/appointments/${id}/status?status=cancelled`, { method: 'PATCH', headers });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
  }

  const upcoming = appointments.filter(a => ['scheduled', 'accepted'].includes(a.status));
  const past = appointments.filter(a => ['completed', 'cancelled'].includes(a.status));

  const STATUS_COLORS: Record<string, string> = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300',
    accepted: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300',
    completed: 'bg-slate-100 text-slate-500',
    cancelled: 'bg-red-100 text-red-600 dark:bg-red-950/20 dark:text-red-400',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-extrabold text-slate-700 dark:text-white mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2f7fc1]" /> Upcoming Appointments
        </h3>
        {loading ? (
          [...Array(2)].map((_, i) => <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl animate-pulse mb-3" />)
        ) : upcoming.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-6">No upcoming appointments</p>
        ) : upcoming.map(appt => (
          <motion.div key={appt.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-4 mb-3 flex items-center gap-4">
            <div className="w-12 h-12 bg-[#2f7fc1]/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Stethoscope className="w-6 h-6 text-[#2f7fc1]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-700 dark:text-white">{appt.doctor?.full_name || 'Doctor'}</p>
              <p className="text-xs text-slate-400">{new Date(appt.appointment_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{appt.reason}</p>
            </div>
            <div className="flex flex-col items-end gap-2 flex-shrink-0">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[appt.status] || ''}`}>
                {appt.status}
              </span>
              {appt.status === 'scheduled' && (
                <button onClick={() => cancelAppointment(appt.id)}
                  className="text-[10px] text-red-500 font-bold hover:underline">
                  Cancel
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {past.length > 0 && (
        <div>
          <h3 className="text-sm font-extrabold text-slate-500 dark:text-slate-400 mb-3">Past Appointments</h3>
          {past.slice(0, 5).map(appt => (
            <div key={appt.id} className="glass-card rounded-2xl p-4 mb-3 flex items-center gap-4 opacity-70">
              <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center flex-shrink-0">
                <CheckCheck className="w-5 h-5 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">{appt.doctor?.full_name}</p>
                <p className="text-xs text-slate-400">{new Date(appt.appointment_date).toLocaleDateString()}</p>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[appt.status] || ''}`}>
                {appt.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Stethoscope import fix
function Stethoscope({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3" />
      <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4" />
      <circle cx="20" cy="10" r="2" />
    </svg>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function DrChat() {
  const { token, role } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('book');

  const tabs: { id: Tab; label: string; Icon: typeof Calendar }[] = [
    { id: 'book', label: 'Book Appointment', Icon: Calendar },
    { id: 'chats', label: 'Chats', Icon: MessageSquare },
    { id: 'appointments', label: 'My Appointments', Icon: CheckCheck },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

      {/* Header */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white font-poppins flex items-center gap-2">
              <Shield className="w-6 h-6 text-[#2f7fc1]" /> Doctor Consultation
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Book slots, chat anonymously, and manage your appointments</p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-600 font-bold">Anonymous & Secure</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass-card rounded-2xl p-1.5 flex gap-1">
        {tabs.map(tab => {
          const Icon = tab.Icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#2f7fc1] text-white shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-[#2f7fc1] hover:bg-[#7cc8ff]/10'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'book' && <BookTab token={token} />}
          {activeTab === 'chats' && <ChatTab token={token} />}
          {activeTab === 'appointments' && <AppointmentsTab token={token} />}
        </motion.div>
      </AnimatePresence>

    </motion.div>
  );
}
