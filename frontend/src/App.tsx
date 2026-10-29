import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useStore } from './store/store';
import { 
  Sun, Moon, AlertTriangle, LogOut, Phone, Share2, ShieldAlert, User,
  Activity, Heart, Dna, PlusSquare, Home, Sparkles, MapPin, Image, MessageSquare, Bell, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import pages
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import DocAI from './pages/DocAI';
import Nearby from './pages/Nearby';
import ImgDoc from './pages/ImgDoc';
import DrChat from './pages/DrChat';
import Profile from './pages/Profile';
import Admin from './pages/Admin';
import DoctorDashboard from './pages/DoctorDashboard';
import DoctorAvailability from './pages/DoctorAvailability';
import DoctorChat from './pages/DoctorChat';
import DoctorNotifications from './pages/DoctorNotifications';

// Route Guards
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const OnboardingRoute = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>;
};

// Global Layout wrapper containing Navbar, Footer, and Floating SOS Button
function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isAuthenticated, user, logout, theme, toggleTheme, showSosPopup, setShowSosPopup } = useStore();
  
  const [sosLoading, setSosLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSosCall = () => {
    window.open('tel:9392995909');
    setShowSosPopup(false);
  };

  const handleSosShare = () => {
    setSosLoading(true);
    
    const sendWhatsApp = (lat: number, lon: number) => {
      const student = user as any;
      const mapsLink = `https://www.google.com/maps?q=${lat},${lon}`;
      
      const messageText = `🚨 EMERGENCY ALERT! 🚨\n\n*Student Name:* ${user?.full_name || 'Guest'}\n*Program:* ${student?.program || 'N/A'}\n*Branch:* ${student?.branch || 'N/A'}\n*Hostel:* ${student?.hostel || 'N/A'}\n\n*Current Live Location:* ${mapsLink}\n\nPlease help immediately.`;
      const encodedMsg = encodeURIComponent(messageText);
      const whatsappUrl = `https://api.whatsapp.com/send?phone=919392995909&text=${encodedMsg}`;
      window.open(whatsappUrl, '_blank');
      setSosLoading(false);
      setShowSosPopup(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          sendWhatsApp(pos.coords.latitude, pos.coords.longitude);
        },
        () => {
          sendWhatsApp(18.1364, 83.4019);
        }
      );
    } else {
      sendWhatsApp(18.1364, 83.4019);
    }
  };

  const { role } = useStore();
  const isDoctor = role === 'doctor';

  // Select navigation paths dynamically based on login status and role
  const navPaths = isAuthenticated
    ? isDoctor
      ? ['/doctor/dashboard', '/doctor/slots', '/doctor/chat', '/doctor/notifications', '/profile']
      : ['/dashboard', '/docai', '/nearby', '/imgdoc', '/drchat', '/profile']
    : ['/docai', '/nearby', '/imgdoc'];

  const labels: Record<string, string> = {
    '/dashboard': 'Home',
    '/docai': 'DocAI',
    '/nearby': 'Nearby',
    '/imgdoc': 'ImgDoc',
    '/drchat': 'Consult',
    '/profile': 'Profile',
    '/doctor/dashboard': 'Dashboard',
    '/doctor/slots': 'Slots',
    '/doctor/chat': 'Patients',
    '/doctor/notifications': 'Alerts',
  };

  const pathIcons: Record<string, React.ReactNode> = {
    '/dashboard': <Home className="w-[18px] h-[18px]" />,
    '/doctor/dashboard': <Home className="w-[18px] h-[18px]" />,
    '/docai': <Sparkles className="w-[18px] h-[18px]" />,
    '/nearby': <MapPin className="w-[18px] h-[18px]" />,
    '/imgdoc': <Image className="w-[18px] h-[18px]" />,
    '/drchat': <MessageSquare className="w-[18px] h-[18px]" />,
    '/doctor/slots': <Calendar className="w-[18px] h-[18px]" />,
    '/doctor/chat': <MessageSquare className="w-[18px] h-[18px]" />,
    '/doctor/notifications': <Bell className="w-[18px] h-[18px]" />,
    '/profile': <User className="w-[18px] h-[18px]" />,
    '/admin': <ShieldAlert className="w-[18px] h-[18px]" />
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FAF8F5] text-[#1D1D1F] transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Background blurred warm neutral blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div 
          animate={{
            x: [0, 60, -40, 0],
            y: [0, -80, 40, 0],
            scale: [1, 1.15, 0.9, 1]
          }}
          transition={{
            duration: 22,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-32 left-10 w-[450px] h-[450px] rounded-full bg-[#A89A88]/5 blur-3xl"
        />
        <motion.div 
          animate={{
            x: [0, -70, 50, 0],
            y: [0, 60, -50, 0],
            scale: [1, 0.9, 1.1, 1]
          }}
          transition={{
            duration: 26,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-1/3 right-10 w-[550px] h-[550px] rounded-full bg-[#F2EDE4]/10 blur-3xl"
        />
        <motion.div 
          animate={{
            x: [0, 40, -30, 0],
            y: [0, 50, -30, 0],
            scale: [1, 1.1, 0.85, 1]
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -bottom-20 left-1/4 w-[350px] h-[350px] rounded-full bg-[#E5E1DA]/10 blur-3xl"
        />

        {/* Subtle Medical Icons */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden mix-blend-multiply">
          <Activity className="absolute top-20 left-20 w-64 h-64 -rotate-12" />
          <Dna className="absolute bottom-20 right-20 w-80 h-80 rotate-12" />
          <Heart className="absolute top-1/3 right-1/4 w-48 h-48 -rotate-6" />
          <PlusSquare className="absolute bottom-1/3 left-1/4 w-56 h-56 rotate-6" />
        </div>
      </div>

      {/* Cursor Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-30 transition-opacity duration-300 opacity-60 hidden md:block"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(168, 154, 136, 0.08), transparent 80%)`
        }}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        {[...Array(10)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              left: `${(i * 13) % 100}%`,
              top: `${(i * 17) % 100}%`
            }}
            animate={{
              y: ['0px', '-80px', '0px'],
              x: ['0px', i % 2 === 0 ? '30px' : '-30px', '0px'],
              opacity: [0.08, 0.25, 0.08]
            }}
            transition={{
              duration: 12 + (i % 5) * 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute w-2 h-2 rounded-full bg-[#A89A88]/20 blur-[1px]"
          />
        ))}
      </div>

      <motion.nav 
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-6 z-50 w-full max-w-7xl mx-auto px-6 mb-4"
      >
        <div className="h-[72px] rounded-full px-8 flex items-center justify-between bg-[#FAF8F5]/80 border border-[#E5E1DA] backdrop-blur-[20px] shadow-sm relative">
          
          {/* Logo */}
          <Link to={isAuthenticated ? "/dashboard" : "/docai"} className="flex items-center gap-2.5 text-left group">
            <motion.img 
              animate={{ y: [0, -3, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              src="/logo.png" 
              alt="Logo" 
              className="w-10 h-10 object-contain rounded-xl"
            />
            <div className="flex flex-col">
              <span className="font-poppins font-extrabold text-base tracking-tight text-[#1D1D1F] m-0 leading-none">
                UNIMEDICINE
              </span>
              <span className="text-[9px] font-bold text-[#6E6E73] tracking-widest uppercase mt-0.5 leading-none">
                JNTU-GV Portal
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-1 text-xs relative">
            {navPaths.map((path) => {
              const isActive = location.pathname === path;
              return (
                <Link 
                  key={path}
                  to={path} 
                  className={`px-[22px] py-2 rounded-full transition-all duration-250 relative font-medium text-sm flex items-center gap-2 z-10 ${
                    isActive 
                      ? 'text-[#1D1D1F] font-semibold' 
                      : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  {pathIcons[path]}
                  <span>
                    {labels[path]}
                  </span>
                  {isActive && (
                    <motion.div 
                      layoutId="appleNavActive"
                      className="absolute inset-0 rounded-full bg-[#F2EDE4] border border-[#E5E1DA] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] -z-10"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
            {isAuthenticated && (user as any)?.is_admin && (
              <Link 
                to="/admin" 
                className={`px-[22px] py-2 rounded-full transition-all duration-250 relative font-medium text-sm flex items-center gap-2 z-10 ${
                  location.pathname === '/admin' 
                    ? 'text-[#1D1D1F] font-semibold' 
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {pathIcons['/admin']}
                <span>
                  Admin
                </span>
                {location.pathname === '/admin' && (
                  <motion.div 
                    layoutId="appleNavActive"
                    className="absolute inset-0 rounded-full bg-[#F2EDE4] border border-[#E5E1DA] shadow-[inset_0_1px_2px_rgba(0,0,0,0.02)] -z-10"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            )}
          </div>

          {/* Nav actions */}
          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <Link
                to={isDoctor ? "/doctor/notifications" : "/drchat"}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F2EDE4] border border-[#E5E1DA] text-[#1D1D1F] hover:bg-[#A89A88] hover:text-white hover:border-[#A89A88] shadow-sm hover:scale-[1.04] transition-all duration-250 cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-[18px] h-[18px]" />
              </Link>
            )}

            {isAuthenticated ? (
              <>
                <button
                  onClick={logout}
                  className="w-10 h-10 rounded-full flex items-center justify-center bg-[#F2EDE4] border border-[#E5E1DA] text-[#C4674F] shadow-sm hover:scale-[1.04] hover:bg-[#F9EBE8] hover:border-[#C4674F]/40 transition-all duration-250 cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="h-10 px-5 rounded-full flex items-center justify-center bg-[#2C2C2E] border border-[#1D1D1F] text-white font-semibold text-xs shadow-md transition-all duration-250 hover:scale-[1.04] flex items-center gap-1.5 cursor-pointer hover:bg-[#A89A88] hover:border-[#A89A88]"
              >
                <User className="w-[14px] h-[14px]" />
                Sign In
              </Link>
            )}
          </div>

        </div>
      </motion.nav>

      {/* MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 relative z-10">
        {children}
      </main>

      {/* FOOTER */}
      <footer className="w-full bg-[#FAF8F5]/80 backdrop-blur-md border-t border-[#E5E1DA] py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 text-left">
          {/* Column 1: Branding */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="UniMedicine" className="w-8 h-8 object-contain rounded-lg" />
              <span className="font-extrabold text-[#1D1D1F] font-poppins text-base">UniMedicine</span>
            </div>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              JNTU-GV University Student & Doctor Medical Portal. Providing AI diagnostics, scheduling, and local medical support.
            </p>
          </div>
          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider font-poppins">Quick Links</h4>
            <div className="flex flex-col gap-2 text-xs text-[#6E6E73]">
              <Link to="/dashboard" className="hover:text-[#2C2C2E] transition-colors">Home Dashboard</Link>
              <Link to="/docai" className="hover:text-[#2C2C2E] transition-colors">DocAI Diagnostics</Link>
              <Link to="/nearby" className="hover:text-[#2C2C2E] transition-colors">Nearby Help</Link>
              <Link to="/drchat" className="hover:text-[#2C2C2E] transition-colors">Consult Doctor</Link>
            </div>
          </div>
          {/* Column 3: Emergency Contacts */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider font-poppins font-semibold">University SOS</h4>
            <div className="flex flex-col gap-2 text-xs text-[#6E6E73]">
              <span className="font-semibold text-rose-500">Emergency: 91-9392995909</span>
              <span>Health Center: JNTU-GV Campus</span>
              <span>Available: 24/7 Helpline</span>
            </div>
          </div>
          {/* Column 4: Info */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-[#1D1D1F] uppercase tracking-wider font-poppins">Compliance</h4>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              All digital suggestions are for informational purposes. For life-threatening emergencies, use the red SOS button or contact university health center.
            </p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-6 mt-8 pt-8 border-t border-[#E5E1DA]/50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-[#6E6E73]">
          <span>© {new Date().getFullYear()} UniMedicine JNTU-GV. All rights reserved.</span>
          <span>Designed for Airy & Glass Excellence</span>
        </div>
      </footer>

      {/* FLOATING RED SOS EMERGENCY BUTTON */}
      <div className="fixed bottom-8 right-8 z-50">
        <motion.button
          onClick={() => setShowSosPopup(true)}
          whileHover={{ scale: 1.1, y: -4 }}
          whileTap={{ scale: 0.95 }}
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 10px 25px -5px rgba(239, 68, 68, 0.4)",
              "0 20px 35px -5px rgba(239, 68, 68, 0.6)",
              "0 10px 25px -5px rgba(239, 68, 68, 0.4)"
            ]
          }}
          transition={{
            scale: { repeat: Infinity, duration: 2, ease: "easeInOut" },
            boxShadow: { repeat: Infinity, duration: 2, ease: "easeInOut" }
          }}
          className="w-16 h-16 bg-gradient-to-r from-red-600 to-rose-500 text-white rounded-full flex items-center justify-center shadow-2xl relative group cursor-pointer"
          title="Emergency SOS Activation"
        >
          <AlertTriangle className="w-8 h-8 fill-white" />
          
          {/* Animated concentric ripples */}
          <span className="absolute -inset-2 rounded-full border-2 border-red-500/30 animate-ping pointer-events-none"></span>
          <span className="absolute -inset-4 rounded-full border border-red-500/10 animate-pulse pointer-events-none"></span>
        </motion.button>
      </div>

      {/* SOS EMERGENCY ACTION MODAL */}
      <AnimatePresence>
        {showSosPopup && (
          <div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="glass-card rounded-3xl p-8 w-full max-w-md text-center border border-red-500/20 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-red-500/10 rounded-full blur-2xl"></div>

              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <h2 className="text-2xl font-extrabold text-slate-855 dark:text-white font-poppins mb-2">
                Emergency SOS Triggered
              </h2>
              <p className="text-xs text-slate-400 mb-6 max-w-xs mx-auto">
                Are you in danger or experiencing an immediate medical crisis? Select an action below.
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSosCall}
                  className="w-full py-4 bg-gradient-to-r from-red-655 to-rose-500 hover:from-red-700 hover:to-rose-600 text-white font-bold text-sm rounded-2xl shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Phone className="w-4.5 h-4.5 fill-white animate-bounce" />
                  Call Health Center SOS (+91 9392995909)
                </button>

                <button
                  onClick={handleSosShare}
                  disabled={sosLoading}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {sosLoading ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <Share2 className="w-4.5 h-4.5" />
                      Share Live Location via WhatsApp
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowSosPopup(false)}
                  className="w-full py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel SOS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-100 dark:border-slate-900/60 py-6 text-center text-xs text-slate-400 dark:text-slate-500 bg-white/20 relative z-10">
        <p>© 2026 UniMedicine Health Cell, JNTU-GV Vizianagaram. All rights reserved.</p>
        <p className="mt-1 text-[10px] font-semibold text-slate-400">
          Built for student health convenience, verified with secure encryption.
        </p>
      </footer>

    </div>
  );
}

export default function App() {
  const { isAuthenticated, user, role } = useStore();
  const showOnboarding = isAuthenticated && role === 'student' && !(user as any)?.is_onboarded;
  const defaultRoute = !isAuthenticated ? '/docai' : role === 'doctor' ? '/doctor/dashboard' : showOnboarding ? '/onboarding' : '/dashboard';

  return (
    <Router>
      <Routes>
        {/* Auth Page */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={defaultRoute} replace />} />

        {/* Onboarding Profile setup */}
        <Route path="/onboarding" element={
          <PrivateRoute>
            <Onboarding />
          </PrivateRoute>
        } />

        {/* ── STUDENT ROUTES ───────────────────────────── */}
        <Route path="/dashboard" element={
          <PrivateRoute>
            <OnboardingRoute>
              <LayoutWrapper>
                <Dashboard />
              </LayoutWrapper>
            </OnboardingRoute>
          </PrivateRoute>
        } />

        {/* Publically Accessible Pages */}
        <Route path="/docai" element={<LayoutWrapper><DocAI /></LayoutWrapper>} />
        <Route path="/nearby" element={<LayoutWrapper><Nearby /></LayoutWrapper>} />
        <Route path="/imgdoc" element={<LayoutWrapper><ImgDoc /></LayoutWrapper>} />

        <Route path="/drchat" element={
          <PrivateRoute>
            <OnboardingRoute>
              <LayoutWrapper>
                <DrChat />
              </LayoutWrapper>
            </OnboardingRoute>
          </PrivateRoute>
        } />

        <Route path="/profile" element={
          <PrivateRoute>
            <OnboardingRoute>
              <LayoutWrapper>
                <Profile />
              </LayoutWrapper>
            </OnboardingRoute>
          </PrivateRoute>
        } />

        <Route path="/admin" element={
          <PrivateRoute>
            <OnboardingRoute>
              <LayoutWrapper>
                <Admin />
              </LayoutWrapper>
            </OnboardingRoute>
          </PrivateRoute>
        } />

        {/* ── DOCTOR ROUTES ───────────────────────────── */}
        <Route path="/doctor/dashboard" element={
          <PrivateRoute>
            <LayoutWrapper>
              <DoctorDashboard />
            </LayoutWrapper>
          </PrivateRoute>
        } />

        <Route path="/doctor/slots" element={
          <PrivateRoute>
            <LayoutWrapper>
              <DoctorAvailability />
            </LayoutWrapper>
          </PrivateRoute>
        } />

        <Route path="/doctor/chat" element={
          <PrivateRoute>
            <LayoutWrapper>
              <DoctorChat />
            </LayoutWrapper>
          </PrivateRoute>
        } />

        <Route path="/doctor/notifications" element={
          <PrivateRoute>
            <LayoutWrapper>
              <DoctorNotifications />
            </LayoutWrapper>
          </PrivateRoute>
        } />

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </Router>
  );
}
