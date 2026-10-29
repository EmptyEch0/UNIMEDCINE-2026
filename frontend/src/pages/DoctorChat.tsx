import {
  MessageSquare, Send, Search, Paperclip, FileText, Download,
  CornerUpLeft, X, User, CheckCheck, Check, Shield, Clock, Loader2,
  Phone, Video, Stethoscope
} from 'lucide-react';
import type { ChatSession, Message } from '../types';
import VideoCallModal from '../components/VideoCallModal';

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

export default function DoctorChat() {
  const { token } = useStore();
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
  
  // Digital Prescription Modal State
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [prescMolecule, setPrescMolecule] = useState('');
  const [prescDosage, setPrescDosage] = useState('1-0-1 after meals');
  const [prescDuration, setPrescDuration] = useState('5 days');
  const [prescNotes, setPrescNotes] = useState('Take with warm water. Rest adequately.');

  const handleIssuePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prescMolecule.trim() || !activeChat) return;

    const prescContent = `📋 OFFICIAL DIGITAL PRESCRIPTION\n\n• Medication: ${prescMolecule}\n• Dosage: ${prescDosage}\n• Duration: ${prescDuration}\n• Instructions: ${prescNotes}\n\nIssued by Campus Doctor. Valid for Campus Pharmacy.`;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        chat_id: activeChat.id,
        content: prescContent,
      }));
    }

    setShowPrescriptionModal(false);
    setPrescMolecule('');
  };

  const wsRef = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const API = 'http://localhost:8000/api';
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetch(`${API}/chats`, { headers }).then(r => r.json()).then(d => Array.isArray(d) && setChatSessions(d)).catch(console.error);
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const ws = new WebSocket(`ws://localhost:8000/api/chats/ws/${token}`);
    wsRef.current = ws;
    ws.onmessage = (e) => {
      const payload = JSON.parse(e.data);
      if (payload.type === 'chat_message') {
        setMessages(prev => prev.some(m => m.id === payload.id) ? prev : [...prev, payload]);
        setChatSessions(prev => prev.map(s =>
          s.id === payload.chat_id ? { ...s, last_message_preview: payload.content } : s
        ));
      } else if (payload.type === 'typing') {
        setPartnerTyping(payload.is_typing);
        if (payload.is_typing) setTimeout(() => setPartnerTyping(false), 3000);
      }
    };
    return () => ws.close();
  }, [token]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, partnerTyping]);

  async function openChat(session: ChatSession) {
    setActiveChat(session);
    const res = await fetch(`${API}/chats/${session.id}/messages`, { headers });
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
    fd.append('record_type', 'Scan');
    try {
      const res = await fetch(`${API}/records`, { method: 'POST', headers, body: fd });
      const data = await res.json();
      if (data.file_url && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          chat_id: activeChat.id,
          content: null,
          file_url: data.file_url,
          file_name: file.name,
        }));
      }
    } catch (e) { console.error(e); }
    setUploading(false);
  }

  const unreadCount = (session: ChatSession) =>
    session.messages?.filter(m => m.sender_type === 'patient' && !m.is_read).length || 0;

  const filtered = chatSessions.filter(s =>
    (s.student?.full_name || s.patient_anon_id || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[calc(100vh-12rem)]">
      <div className="glass-card rounded-3xl overflow-hidden h-full flex flex-col">

        {/* Header */}
        <div className="p-5 border-b border-white/10 dark:border-slate-800/50 flex items-center justify-between">
          <h1 className="text-lg font-extrabold text-slate-800 dark:text-white font-poppins flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#2f7fc1]" /> Patient Chats
          </h1>
          <span className="text-xs text-[#2f7fc1] bg-[#7cc8ff]/10 px-3 py-1.5 rounded-full font-bold">
            {chatSessions.length} conversations
          </span>
        </div>

        <div className="flex flex-1 overflow-hidden">

          {/* Chat List */}
          <div className="w-72 flex-shrink-0 border-r border-white/10 dark:border-slate-800/50 flex flex-col">
            <div className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients..."
                  className="w-full pl-9 pr-3 py-2 bg-white/10 dark:bg-slate-800/30 rounded-xl text-xs border border-transparent focus:border-[#7cc8ff]/30 outline-none" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              {filtered.map(session => {
                const unread = unreadCount(session);
                return (
                  <button key={session.id} onClick={() => openChat(session)}
                    className={`w-full text-left px-4 py-4 hover:bg-[#7cc8ff]/5 transition-colors border-b border-white/5 ${activeChat?.id === session.id ? 'bg-[#7cc8ff]/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#2f7fc1]/10 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-5 h-5 text-[#2f7fc1]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-slate-700 dark:text-white truncate">
                            {session.patient_anon_id}
                          </p>
                          {unread > 0 && (
                            <span className="w-5 h-5 bg-[#2f7fc1] text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                              {unread}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate">
                          {session.student?.full_name || 'Student'}
                        </p>
                        <p className="text-[10px] text-slate-300 mt-0.5">
                          {new Date(session.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">No conversations</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Window */}
          <div className="flex-1 flex flex-col">
            {!activeChat ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">Select a patient chat</p>
                  <p className="text-xs text-slate-300 mt-1">All conversations are anonymous</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-white/10 dark:border-slate-800/50 flex items-center gap-3">
                  <div className="w-9 h-9 bg-[#2f7fc1]/10 rounded-full flex items-center justify-center">
                    <Shield className="w-4 h-4 text-[#2f7fc1]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-700 dark:text-white">{activeChat.patient_anon_id}</p>
                    <p className="text-xs text-slate-400">{activeChat.student?.full_name} • {activeChat.student?.hostel || 'Student'}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button 
                      onClick={() => { setCallType('voice'); setCallModalOpen(true); }}
                      className="p-2 rounded-xl hover:bg-[#7cc8ff]/10 text-slate-600 dark:text-slate-300 transition-colors animate-btn cursor-pointer" 
                      title="Voice Call Student"
                    >
                      <Phone className="w-4 h-4 text-[#2f7fc1]" />
                    </button>
                    <button 
                      onClick={() => { setCallType('video'); setCallModalOpen(true); }}
                      className="p-2 rounded-xl hover:bg-[#7cc8ff]/10 text-slate-600 dark:text-slate-300 transition-colors animate-btn cursor-pointer" 
                      title="Video Call Student"
                    >
                      <Video className="w-4 h-4 text-[#2f7fc1]" />
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.map(msg => {
                    const isDoctor = msg.sender_type === 'doctor';
                    const isImage = msg.file_url?.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                    return (
                      <div key={msg.id} className={`flex ${isDoctor ? 'justify-end' : 'justify-start'} group`}>
                        <div className="max-w-[75%] space-y-1">
                          {msg.content && (
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              isDoctor
                                ? 'bg-gradient-to-br from-[#2f7fc1] to-[#1f5b8c] text-white rounded-br-sm shadow-md'
                                : 'bg-white/60 dark:bg-slate-800/60 text-slate-700 dark:text-white rounded-bl-sm border border-white/40 shadow-sm'
                            }`}>
                              {msg.content}
                              <div className={`flex items-center gap-1 mt-1 ${isDoctor ? 'justify-end' : 'justify-start'}`}>
                                <span className="text-[10px] opacity-60">
                                  {new Date(msg.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {isDoctor && (msg.is_read
                                  ? <CheckCheck className="w-3 h-3 text-[#7cc8ff]" />
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
                                  isDoctor ? 'bg-[#2f7fc1]/90 text-white hover:bg-[#2f7fc1]' : 'glass-card border border-white/20 hover:bg-white/40'
                                }`}>
                                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                                  <FileText className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="truncate text-xs font-bold">{msg.file_name || 'Medical Document.pdf'}</p>
                                  <span className="text-[10px] opacity-75 uppercase font-mono font-semibold">Attached Document</span>
                                </div>
                                <Download className="w-4 h-4 flex-shrink-0 opacity-80" />
                              </a>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {partnerTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Banner */}
                <AnimatePresence>
                  {replyTo && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="px-4 py-2 bg-[#7cc8ff]/10 border-t border-[#7cc8ff]/20 flex items-center gap-2">
                      <CornerUpLeft className="w-3.5 h-3.5 text-[#2f7fc1]" />
                      <p className="text-xs text-slate-500 flex-1 truncate">{replyTo.content}</p>
                      <button onClick={() => setReplyTo(null)}><X className="w-3 h-3 text-slate-400" /></button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Input */}
                <div className="p-4 border-t border-white/10 dark:border-slate-800/50">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 glass-card rounded-2xl border border-[#7cc8ff]/20 flex items-end">
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
                        <button 
                          onClick={() => setShowPrescriptionModal(true)}
                          className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 transition-colors font-bold text-xs flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20" 
                          title="Write Prescription"
                        >
                          <Stethoscope className="w-3.5 h-3.5" />
                          <span>Rx</span>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 rounded-lg hover:bg-[#7cc8ff]/10 text-slate-400 hover:text-[#2f7fc1] transition-colors">
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
                      className="p-3.5 bg-[#2f7fc1] text-white rounded-2xl shadow-md hover:bg-[#1f5b8c] transition-all disabled:opacity-40"
                    >
                      <Send className="w-4 h-4" />
                    </motion.button>
                  </div>
                </div>

                {/* WebRTC Video Call Modal */}
                <VideoCallModal
                  isOpen={callModalOpen}
                  onClose={() => setCallModalOpen(false)}
                  partnerName={activeChat.student?.full_name || activeChat.patient_anon_id || 'Student Patient'}
                  partnerRole="Student Patient"
                  callType={callType}
                />

                {/* DIGITAL PRESCRIPTION MODAL */}
                {showPrescriptionModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                        <h3 className="font-extrabold text-sm font-poppins flex items-center gap-2 m-0 text-emerald-400">
                          <Stethoscope className="w-4 h-4" /> Write Digital Prescription
                        </h3>
                        <button onClick={() => setShowPrescriptionModal(false)}><X className="w-4 h-4 text-slate-400" /></button>
                      </div>

                      <form onSubmit={handleIssuePrescription} className="space-y-4 text-left">
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Medicine Molecule / Name
                          </label>
                          <input 
                            type="text"
                            required
                            placeholder="e.g. Paracetamol 500mg, Cetirizine 10mg"
                            value={prescMolecule}
                            onChange={e => setPrescMolecule(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Dosage Schedule
                            </label>
                            <input 
                              type="text"
                              value={prescDosage}
                              onChange={e => setPrescDosage(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                              Duration
                            </label>
                            <input 
                              type="text"
                              value={prescDuration}
                              onChange={e => setPrescDuration(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                            Patient Instructions & Notes
                          </label>
                          <textarea 
                            rows={2}
                            value={prescNotes}
                            onChange={e => setPrescNotes(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none"
                          />
                        </div>

                        <div className="flex gap-2 pt-2">
                          <button 
                            type="button" 
                            onClick={() => setShowPrescriptionModal(false)}
                            className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-400 text-xs font-bold"
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                          >
                            Issue Rx to Patient
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
