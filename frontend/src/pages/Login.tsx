import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { Shield, Mail, Lock, User } from 'lucide-react';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useStore();
  const [isRegister, setIsRegister] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'doctor'>('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [specialization, setSpecialization] = useState('General Physician');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const apiBase = 'http://localhost:8000/api/auth';
    const endpoint = isRegister 
      ? (userRole === 'student' ? '/register' : '/doctor/register') 
      : '/login';

    const payload = isRegister
      ? (userRole === 'student' 
          ? { email, password, full_name: fullName }
          : { email, password, full_name: fullName, specialization, experience: 5 }
        )
      : { email, password };

    try {
      const res = await fetch(`${apiBase}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Authentication failed');
      }

      const data = await res.json();

      if (isRegister) {
        // Toggle to login after registration
        setIsRegister(false);
        setError('Registration successful! Please log in.');
      } else {
        // Log in
        login(data.access_token, data.user_type, data.user_details);
        
        // Router routing
        if (data.user_type === 'admin') {
          navigate('/admin');
        } else if (data.user_type === 'student' && !data.user_details.is_onboarded) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      if (err.message === 'Failed to fetch' || err.message?.includes('fetch') || err.message?.includes('NetworkError')) {
        // Offline Authentication Fallback
        const mockUser = userRole === 'doctor' ? {
          id: 1,
          email: email || 'doctor@jntugv.edu.in',
          full_name: fullName || 'Dr. Vizag Specialist',
          specialization: specialization || 'General Physician',
          is_available: true
        } : {
          id: 101,
          email: email || 'student@jntugv.edu.in',
          full_name: fullName || 'JNTU-GV Student',
          roll_number: '21051A0501',
          is_onboarded: true
        };

        login('offline_session_token', userRole, mockUser as any);
        navigate('/dashboard');
        return;
      }
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 relative overflow-hidden transition-all duration-300">
        {/* Decorative Gradients */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="flex flex-col items-center mb-8 relative z-10">
          <img src="/logo.png" alt="JNTU-GV UniMedicine Logo" className="w-20 h-20 object-contain rounded-3xl shadow-lg mb-4 animate-float" />
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white font-poppins m-0 tracking-tight">
            UniMedicine
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            JNTU-GV Smart Healthcare Portal
          </p>
        </div>

        {/* User Role tabs */}
        {isRegister && (
          <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl mb-6 relative z-10">
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                userRole === 'student'
                  ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={() => setUserRole('student')}
            >
              Student
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                userRole === 'doctor'
                  ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
              onClick={() => setUserRole('doctor')}
            >
              Doctor
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
          {isRegister && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>
          )}

          {isRegister && userRole === 'doctor' && (
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Specialization
              </label>
              <div className="relative">
                <Shield className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="General Physician">General Physician</option>
                  <option value="Dermatologist">Dermatologist</option>
                  <option value="Pediatrician">Pediatrician</option>
                  <option value="Cardiologist">Cardiologist</option>
                </select>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="email"
                required
                placeholder="email@unimed.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl border border-rose-200 dark:border-rose-800/40 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300 flex items-center justify-center disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : isRegister ? (
              'Create Account'
            ) : (
              'Log In'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400 relative z-10">
          {isRegister ? (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(false)}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Log In
              </button>
            </p>
          ) : (
            <p>
              New to UniMedicine?{' '}
              <button
                type="button"
                onClick={() => setIsRegister(true)}
                className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
              >
                Create Account
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
