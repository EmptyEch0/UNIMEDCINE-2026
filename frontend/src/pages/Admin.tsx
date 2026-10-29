import { useState, useEffect } from 'react';
import { useStore } from '../store/store';
import { 
  Users, Activity, Shield, BookOpen, Calendar
} from 'lucide-react';
import type { UserDetails } from '../types';

export default function Admin() {
  const { token } = useStore();
  const [stats, setStats] = useState<any | null>(null);
  const [students, setStudents] = useState<UserDetails[]>([]);
  const [adminTab, setAdminTab] = useState<'stats' | 'students' | 'notices'>('stats');

  // Form state for publishing notices
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeCategory, setNoticeCategory] = useState('Camp');
  const [noticeDate, setNoticeDate] = useState('');
  const [publishing, setPublishing] = useState(false);

  const fetchStats = async () => {
    try {
      const statsRes = await fetch('http://localhost:8000/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStudents = async () => {
    try {
      const studRes = await fetch('http://localhost:8000/api/admin/students', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (studRes.ok) {
        const data = await studRes.json();
        setStudents(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchStudents();
  }, [token]);

  const handlePublishNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishing(true);
    try {
      const res = await fetch('http://localhost:8000/api/notices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: noticeTitle,
          content: noticeContent,
          category: noticeCategory,
          date: noticeDate
        })
      });

      if (res.ok) {
        setNoticeTitle('');
        setNoticeContent('');
        setNoticeDate('');
        fetchStats(); // reload recent notices
        alert("Notice published successfully to JNTU-GV Medical Notice Board!");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Admin Panel Welcome Banner */}
      <div className="glass-card rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-poppins m-0">
            JNTU-GV UniMedicine Admin Console
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            System administration, medical notice board distribution, and health statistics.
          </p>
        </div>

        <div className="flex gap-2">
          {['stats', 'students', 'notices'].map((tab) => (
            <button
              key={tab}
              onClick={() => setAdminTab(tab as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wider ${
                adminTab === tab
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              {tab === 'stats' ? 'Analytics' : tab === 'students' ? 'Students List' : 'Publish Notice'}
            </button>
          ))}
        </div>
      </div>

      {/* STATS ANALYTICS WORKSPACE */}
      {adminTab === 'stats' && stats && (
        <div className="space-y-6">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card rounded-3xl p-5 text-left">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-widest">Students Registered</span>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white font-poppins">{stats.metrics?.students}</span>
                <Users className="w-8 h-8 text-blue-500 bg-blue-500/10 p-1.5 rounded-xl" />
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5 text-left">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-widest">Medical Officers</span>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white font-poppins">{stats.metrics?.doctors}</span>
                <Shield className="w-8 h-8 text-emerald-500 bg-emerald-500/10 p-1.5 rounded-xl" />
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5 text-left">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-widest">Active Consultations</span>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white font-poppins">{stats.metrics?.active_chats}</span>
                <Activity className="w-8 h-8 text-indigo-500 bg-indigo-500/10 p-1.5 rounded-xl animate-pulse" />
              </div>
            </div>

            <div className="glass-card rounded-3xl p-5 text-left">
              <span className="text-[10px] font-bold text-slate-400 block mb-1.5 uppercase tracking-widest">Appointments Booked</span>
              <div className="flex justify-between items-center">
                <span className="text-3xl font-extrabold text-slate-800 dark:text-white font-poppins">{stats.metrics?.appointments}</span>
                <Calendar className="w-8 h-8 text-purple-500 bg-purple-500/10 p-1.5 rounded-xl" />
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Recent Appointments */}
            <div className="glass-card rounded-3xl p-6 text-left">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                Recent Scheduled Appointments
              </h3>
              <div className="space-y-3">
                {stats.recent_appointments?.length > 0 ? (
                  stats.recent_appointments.map((appt: any) => (
                    <div key={appt.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-850 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">
                          👤 {appt.student_name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Doctor: Dr. {appt.doctor_name} • Date: {new Date(appt.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-[10px] font-extrabold uppercase bg-indigo-500/10 text-indigo-600 px-2 py-0.5 rounded">
                        {appt.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">No recent appointments.</div>
                )}
              </div>
            </div>

            {/* Recent Notices */}
            <div className="glass-card rounded-3xl p-6 text-left">
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                Recently Published Notices
              </h3>
              <div className="space-y-3">
                {stats.recent_notices?.length > 0 ? (
                  stats.recent_notices.map((notice: any) => (
                    <div key={notice.id} className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-855 flex justify-between items-center">
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800 dark:text-white">
                          📢 {notice.title}
                        </h4>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Date: {new Date(notice.date).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded">
                        {notice.category}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 text-xs">No notices published yet.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STUDENTS LIST WORKSPACE */}
      {adminTab === 'students' && (
        <div className="glass-card rounded-3xl p-6 text-left overflow-hidden">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            Registered Student Catalog
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-slate-500 dark:text-slate-400">
              <thead className="text-[10px] text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-900">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Student Name</th>
                  <th className="px-4 py-3">Email Address</th>
                  <th className="px-4 py-3">Program</th>
                  <th className="px-4 py-3">Branch / Specialization</th>
                  <th className="px-4 py-3">Hostel</th>
                  <th className="px-4 py-3 rounded-r-lg">Onboarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40">
                    <td className="px-4 py-3.5 font-bold text-slate-800 dark:text-white">
                      {student.full_name}
                    </td>
                    <td className="px-4 py-3.5 font-semibold">
                      {student.email}
                    </td>
                    <td className="px-4 py-3.5">
                      {student.program || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5">
                      {student.branch || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5">
                      {student.hostel || 'N/A'}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                        student.is_onboarded ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                      }`}>
                        {student.is_onboarded ? 'Yes' : 'No'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* HEALTH NOTICE PUBLISHING PANEL */}
      {adminTab === 'notices' && (
        <div className="glass-card rounded-3xl p-6 text-left max-w-lg mx-auto">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-white uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
            Publish Campus Health Notice
          </h3>

          <form onSubmit={handlePublishNotice} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notice Title</label>
              <input 
                type="text" 
                required
                placeholder="e.g. Free Eye Testing Camp 2026" 
                value={noticeTitle}
                onChange={(e) => setNoticeTitle(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-850" 
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Notice Details</label>
              <textarea 
                required
                rows={4}
                placeholder="Describe the medical camp, timings, location, and instruction..." 
                value={noticeContent}
                onChange={(e) => setNoticeContent(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-850 resize-none" 
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Notice Category</label>
                <select
                  value={noticeCategory}
                  onChange={(e) => setNoticeCategory(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-850"
                >
                  <option value="Camp">Medical Camp</option>
                  <option value="Vaccination">Vaccination Drive</option>
                  <option value="Announcement">Health Advisory</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Event Date</label>
                <input 
                  type="date" 
                  required
                  value={noticeDate}
                  onChange={(e) => setNoticeDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800" 
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={publishing}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              {publishing ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <BookOpen className="w-4.5 h-4.5" />
                  Publish Notice Immediately
                </>
              )}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
