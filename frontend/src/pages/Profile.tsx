import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/store';
import { 
  User, Bell, FileText, Plus, Trash2, 
  ToggleLeft, ToggleRight, Edit, Upload, Download, Check, X,
  QrCode, Shield, Phone, Printer, Activity
} from 'lucide-react';

export default function Profile() {
  const [searchParams] = useSearchParams();
  const { user, token, logout, reminders, records, setReminders, addReminder, setRecords, addRecord, removeRecord } = useStore();
  
  // Tab states
  const activeTab = searchParams.get('tab') || 'info';
  const [tab, setTab] = useState(activeTab);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [profileData, setProfileData] = useState({
    fullName: user?.full_name || '',
    emergencyContact: (user as any)?.emergency_contact || '',
    bloodGroup: (user as any)?.blood_group || 'O+',
    allergies: (user as any)?.allergies || '',
    medicalHistory: (user as any)?.medical_history || ''
  });

  // Reminders modal state
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [newReminder, setNewReminder] = useState({
    name: '',
    dose: '1 Tablet',
    time: '08:00',
    repeat_days: 'Daily'
  });

  // Emergency QR Badge state
  const [showQrModal, setShowQrModal] = useState(false);

  // Records state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadType, setUploadType] = useState('PDF');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Load reminders & records
  useEffect(() => {
    const fetchReminders = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/reminders', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setReminders(data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    const fetchRecords = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/records', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setRecords(data);
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchReminders();
    fetchRecords();
  }, [token]);

  // Handle profile edit save
  const handleSaveProfile = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          program: (user as any).program || 'UG',
          branch: (user as any).branch || 'CSE',
          hostel: (user as any).hostel || 'BH-1',
          emergency_contact: profileData.emergencyContact,
          blood_group: profileData.bloodGroup,
          allergies: profileData.allergies,
          medical_history: profileData.medicalHistory
        })
      });
      if (res.ok) {
        setIsEditing(false);
        // Refresh page or update context
        window.location.reload();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Reminder Actions
  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:8000/api/reminders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReminder)
      });
      if (res.ok) {
        const data = await res.json();
        addReminder(data);
        setShowReminderModal(false);
        setNewReminder({ name: '', dose: '1 Tablet', time: '08:00', repeat_days: 'Daily' });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleReminder = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/reminders/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        // Toggle locally
        setReminders(reminders.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteReminder = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/reminders/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setReminders(reminders.filter(r => r.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Record Actions
  const handleUploadRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !uploadTitle) return;

    setUploadLoading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('title', uploadTitle);
    formData.append('record_type', uploadType);

    try {
      const res = await fetch('http://localhost:8000/api/records/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        addRecord(data);
        setUploadTitle('');
        setUploadFile(null);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUploadLoading(false);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    try {
      const res = await fetch(`http://localhost:8000/api/records/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        removeRecord(id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const studentDetails = user as any;

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      
      {/* LEFT TABS PANEL */}
      <div className="lg:col-span-3 glass-card rounded-3xl p-4 space-y-2">
        <button
          onClick={() => setTab('info')}
          className={`w-full p-3.5 rounded-2xl font-extrabold text-sm flex items-center gap-3 text-left transition-all ${
            tab === 'info'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <User className="w-5 h-5" />
          Demographic Info
        </button>
        <button
          onClick={() => setTab('reminders')}
          className={`w-full p-3.5 rounded-2xl font-extrabold text-sm flex items-center gap-3 text-left transition-all ${
            tab === 'reminders'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <Bell className="w-5 h-5" />
          Meds Reminders
        </button>
        <button
          onClick={() => setTab('records')}
          className={`w-full p-3.5 rounded-2xl font-extrabold text-sm flex items-center gap-3 text-left transition-all ${
            tab === 'records'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-5 h-5" />
          Health Records
        </button>
        
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={logout}
            className="w-full p-3.5 rounded-2xl font-extrabold text-sm flex items-center gap-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-left transition-all"
          >
            <Trash2 className="w-5 h-5" />
            Log Out Account
          </button>
        </div>
      </div>

      {/* RIGHT CONTENT PANEL */}
      <div className="lg:col-span-9 glass-card rounded-3xl p-8 min-h-[400px] text-left relative overflow-hidden">
        
        {/* INFO TAB */}
        {tab === 'info' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-poppins m-0">
                  Demographic & Medical Profile
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Manage your personal details for quick access during checkups.
                </p>
              </div>
              {!isEditing ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowQrModal(true)}
                    className="px-4 py-2 bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-rose-500/20 transition-all cursor-pointer"
                  >
                    <QrCode className="w-4 h-4" />
                    Emergency Health QR Badge
                  </button>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-all"
                  >
                    <Edit className="w-4 h-4" />
                    Edit Profile
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-bold"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md transition-all"
                  >
                    <Check className="w-4 h-4" />
                    Save
                  </button>
                </div>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Full Name</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.fullName}
                      onChange={(e) => setProfileData(prev => ({ ...prev, fullName: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-850 bg-white"
                    />
                  ) : (
                    <p className="font-extrabold text-slate-800 dark:text-white">{user?.full_name}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Program & Branch</span>
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    {studentDetails?.program || 'N/A'} - {studentDetails?.branch || 'N/A'}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Accomodation</span>
                  <p className="font-semibold text-slate-600 dark:text-slate-300">
                    {studentDetails?.hostel || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Blood Group</span>
                  {isEditing ? (
                    <select
                      value={profileData.bloodGroup}
                      onChange={(e) => setProfileData(prev => ({ ...prev, bloodGroup: e.target.value }))}
                      className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                    </select>
                  ) : (
                    <span className="font-bold bg-rose-500/10 text-rose-500 px-2.5 py-1 rounded-lg text-xs">
                      {studentDetails?.blood_group || 'O+'}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Emergency Phone</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.emergencyContact}
                      onChange={(e) => setProfileData(prev => ({ ...prev, emergencyContact: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  ) : (
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{studentDetails?.emergency_contact || 'None registered'}</p>
                  )}
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Known Allergies</span>
                  {isEditing ? (
                    <input 
                      type="text" 
                      value={profileData.allergies}
                      onChange={(e) => setProfileData(prev => ({ ...prev, allergies: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                    />
                  ) : (
                    <p className="font-semibold text-slate-700 dark:text-slate-300">{studentDetails?.allergies || 'None reported'}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <span className="text-[10px] font-bold text-slate-400 block mb-2 uppercase tracking-wider">Personal Medical History</span>
              {isEditing ? (
                <textarea
                  value={profileData.medicalHistory}
                  onChange={(e) => setProfileData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white resize-none"
                />
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium bg-slate-50 dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  {studentDetails?.medical_history || 'No historical medical records provided.'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* REMINDERS TAB */}
        {tab === 'reminders' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-poppins m-0">
                  Medicine Reminders
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Keep track of daily dosage timings and get notified on time.
                </p>
              </div>
              <button
                onClick={() => setShowReminderModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/10 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Medicine
              </button>
            </div>

            {/* Reminders List */}
            <div className="grid md:grid-cols-2 gap-4">
              {reminders.length > 0 ? (
                reminders.map((reminder) => (
                  <div 
                    key={reminder.id} 
                    className={`p-4 rounded-2xl border flex justify-between items-center transition-all ${
                      reminder.is_active 
                        ? 'border-blue-500/20 bg-blue-50/20 dark:bg-blue-950/10' 
                        : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 opacity-60'
                    }`}
                  >
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-slate-800 dark:text-white">
                        💊 {reminder.name}
                      </h4>
                      <p className="text-xs text-slate-500">
                        Dosage: {reminder.dose} • Time: {reminder.time} ({reminder.repeat_days})
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleReminder(reminder.id)}
                        className="text-slate-400 hover:text-blue-600 transition-colors"
                      >
                        {reminder.is_active ? (
                          <ToggleRight className="w-8 h-8 text-blue-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-slate-400" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDeleteReminder(reminder.id)}
                        className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-slate-400 text-xs font-semibold">
                  No active medicine reminders scheduled.
                </div>
              )}
            </div>
          </div>
        )}

        {/* RECORDS TAB */}
        {tab === 'records' && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-poppins m-0">
                Medical Vault & Records
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Securely store prescriptions, scans, and blood reports.
              </p>
            </div>

            {/* File upload form */}
            <form onSubmit={handleUploadRecord} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 grid md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Record Title</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Cough Syrup Rx" 
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs" 
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">File Type</label>
                <select 
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold"
                >
                  <option value="PDF">PDF Report</option>
                  <option value="Prescription">Prescription</option>
                  <option value="Blood Report">Blood Report</option>
                  <option value="Scan">Body Scan</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Choose File</label>
                <input 
                  type="file" 
                  required
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-500 file:mr-2 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer" 
                />
              </div>

              <button
                type="submit"
                disabled={uploadLoading}
                className="py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all flex items-center justify-center gap-1"
              >
                {uploadLoading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload File
                  </>
                )}
              </button>
            </form>

            {/* Uploaded records list */}
            <div className="space-y-3">
              {records.length > 0 ? (
                records.map((rec) => (
                  <div 
                    key={rec.id} 
                    className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white/30 flex items-center justify-between hover:border-blue-500/20 transition-all"
                  >
                    <div className="flex items-center gap-3 text-left">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/5 text-blue-600 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-800 dark:text-white m-0">
                          {rec.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">
                          Type: {rec.record_type} • Uploaded {new Date(rec.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={`http://localhost:8000${rec.file_url}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 bg-blue-500/10 text-blue-600 rounded-xl hover:bg-blue-500/20 transition-all"
                        title="Download Record"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
                        className="p-2 bg-rose-500/10 text-rose-500 rounded-xl hover:bg-rose-500/20 transition-all"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs font-semibold">
                  No records uploaded yet.
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Reminder Add Modal */}
      {showReminderModal && (
        <div className="fixed inset-0 bg-slate-950/60 z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-3xl p-6 w-full max-w-sm relative animate-float text-left">
            <h3 className="font-extrabold text-base text-slate-800 dark:text-white font-poppins mb-4">
              Create Pill Reminder
            </h3>

            <form onSubmit={handleAddReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Medicine Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Paracetamol" 
                  value={newReminder.name}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Dosage</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. 1 Tablet" 
                    value={newReminder.dose}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, dose: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Timing</label>
                  <input 
                    type="time" 
                    required
                    value={newReminder.time}
                    onChange={(e) => setNewReminder(prev => ({ ...prev, time: e.target.value }))}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Frequency</label>
                <select
                  value={newReminder.repeat_days}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, repeat_days: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-850"
                >
                  <option value="Daily">Daily</option>
                  <option value="Mon-Fri">Mon-Fri</option>
                  <option value="Every 12 Hours">Every 12 Hours</option>
                  <option value="As Needed (SOS)">As Needed (SOS)</option>
                </select>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowReminderModal(false)} 
                  className="px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 text-slate-500"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                >
                  Add Reminder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EMERGENCY QR BADGE MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-md w-full shadow-2xl relative space-y-6 overflow-hidden">
            
            {/* Header */}
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-rose-500" />
                <h3 className="text-base font-extrabold font-poppins m-0">
                  Campus Emergency Health ID
                </h3>
              </div>
              <button 
                onClick={() => setShowQrModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Health Card Content */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 rounded-2xl p-5 space-y-5 text-left relative shadow-lg">
              
              {/* Top Banner */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-extrabold text-blue-400 uppercase tracking-widest block">
                    JNTU-GV UNIMEDICINE
                  </span>
                  <h4 className="text-lg font-black font-poppins text-white mt-0.5">
                    {user?.full_name || 'Student'}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    Roll: {(user as any)?.roll_number || '21051A0501'} • {(user as any)?.branch || 'CSE'}
                  </p>
                </div>
                <div className="bg-rose-500/20 text-rose-400 border border-rose-500/30 px-3 py-1 rounded-xl text-xs font-black">
                  BLOOD: {profileData.bloodGroup}
                </div>
              </div>

              {/* Dynamic SVG QR Code Box */}
              <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-200 shadow-inner">
                <svg viewBox="0 0 100 100" className="w-36 h-36">
                  {/* Outer Frame & Finder patterns */}
                  <rect x="0" y="0" width="100" height="100" fill="white" />
                  <rect x="5" y="5" width="25" height="25" fill="#1e293b" />
                  <rect x="8" y="8" width="19" height="19" fill="white" />
                  <rect x="11" y="11" width="13" height="13" fill="#1e293b" />
                  
                  <rect x="70" y="5" width="25" height="25" fill="#1e293b" />
                  <rect x="73" y="8" width="19" height="19" fill="white" />
                  <rect x="76" y="11" width="13" height="13" fill="#1e293b" />

                  <rect x="5" y="70" width="25" height="25" fill="#1e293b" />
                  <rect x="8" y="73" width="19" height="19" fill="white" />
                  <rect x="11" y="76" width="13" height="13" fill="#1e293b" />

                  {/* Data modules pattern */}
                  <rect x="35" y="10" width="5" height="5" fill="#1e293b" />
                  <rect x="45" y="10" width="10" height="5" fill="#1e293b" />
                  <rect x="60" y="10" width="5" height="5" fill="#1e293b" />
                  
                  <rect x="35" y="20" width="10" height="5" fill="#1e293b" />
                  <rect x="50" y="20" width="15" height="5" fill="#1e293b" />

                  <rect x="10" y="35" width="15" height="5" fill="#1e293b" />
                  <rect x="30" y="35" width="40" height="5" fill="#1e293b" />
                  <rect x="75" y="35" width="15" height="5" fill="#1e293b" />

                  <rect x="15" y="45" width="10" height="10" fill="#1e293b" />
                  <rect x="35" y="45" width="20" height="10" fill="#1e293b" />
                  <rect x="65" y="45" width="20" height="10" fill="#1e293b" />

                  <rect x="10" y="60" width="20" height="5" fill="#1e293b" />
                  <rect x="35" y="60" width="30" height="5" fill="#1e293b" />
                  <rect x="70" y="60" width="15" height="5" fill="#1e293b" />

                  <rect x="35" y="75" width="10" height="15" fill="#1e293b" />
                  <rect x="55" y="75" width="15" height="10" fill="#1e293b" />
                  <rect x="75" y="75" width="15" height="15" fill="#1e293b" />
                </svg>
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-2">
                  Scan for Paramedic Emergency Data
                </span>
              </div>

              {/* Critical Medical Info grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                    Hostel & Room
                  </span>
                  <span className="font-bold text-white">
                    {(user as any)?.hostel || 'BH-1'} Room 302
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/50">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">
                    Emergency Contact
                  </span>
                  <span className="font-bold text-emerald-400">
                    {profileData.emergencyContact || '+91 9392995909'}
                  </span>
                </div>
              </div>

              {/* Critical Warnings */}
              {profileData.allergies && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                  ⚠️ Known Allergies: {profileData.allergies}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 border border-slate-700"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                Print / Save PDF
              </button>
              <button
                onClick={() => setShowQrModal(false)}
                className="py-3 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
