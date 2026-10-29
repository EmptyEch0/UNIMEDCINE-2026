import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/store';
import { 
  MapPin, Stethoscope, Camera, MessageSquare, AlertTriangle, 
  Sun, Calendar, Bell, Droplet, Heart, Flame, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { HealthNotice } from '../types';

const MotionLink = motion(Link);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, role, token, setShowSosPopup } = useStore();
  const [notices, setNotices] = useState<HealthNotice[]>([]);
  const [tip, setTip] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const autoplayTimer = useRef<NodeJS.Timeout | null>(null);
  const pauseTimer = useRef<NodeJS.Timeout | null>(null);

  // Health tips array to rotate
  const healthTips = [
    "Drink at least 3-4 liters of water to avoid dehydration in Vizianagaram heat.",
    "Get 7-8 hours of sleep during exam season to maintain cognitive clarity.",
    "Wash your hands frequently at the hostel mess to prevent gastroenteritis.",
    "Include seasonal fruits like citrus and bananas in your diet for electrolytes.",
    "Take short breaks every 45 minutes of laptop screen time to avoid eye strain."
  ];

  // Carousel items definition
  const carouselItems = [
    {
      img: '/clinic_reception.png',
      title: "Campus Wellness Center",
      caption: "A bright, modern university health clinic reception desk with professional staff."
    },
    {
      img: '/doctor_call.png',
      title: "24/7 Virtual Consultations",
      caption: "Connect with certified doctors instantly on video calls from your hostel."
    },
    {
      img: '/student_app.png',
      title: "AI Symptom Checker",
      caption: "Analyze minor symptoms anytime and receive clinical guidance reports."
    },
    {
      img: '/skin_scan.png',
      title: "Dermal Scan Diagnostics",
      caption: "Take skin, eye, or tongue scans to detect conditions using machine learning."
    },
    {
      img: '/campus_map.png',
      title: "Locate Clinics & Pharmacies",
      caption: "Find the closest hospital or dispensary around the JNTU-GV campus."
    },
    {
      img: '/emergency_sos.png',
      title: "Campus SOS Emergency Desk",
      caption: "Emergency coordinates broadcast system for instant secure dispatch."
    }
  ];

  useEffect(() => {
    // Select random health tip
    setTip(healthTips[Math.floor(Math.random() * healthTips.length)]);

    // Fetch JNTU-GV health notices
    const fetchNotices = async () => {
      try {
        const res = await fetch('http://localhost:8000/api/notices', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setNotices(data);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchNotices();
  }, [token]);

  // Autoplay handler
  useEffect(() => {
    if (isPaused) return;

    autoplayTimer.current = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % carouselItems.length);
    }, 3000);

    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    };
  }, [isPaused]);

  const handleThumbnailClick = (index: number) => {
    setActiveIndex(index);
    setIsPaused(true);

    if (autoplayTimer.current) clearInterval(autoplayTimer.current);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);

    // Pause autoplay for 6 seconds, then resume
    pauseTimer.current = setTimeout(() => {
      setIsPaused(false);
    }, 6000);
  };

  useEffect(() => {
    return () => {
      if (autoplayTimer.current) clearInterval(autoplayTimer.current);
      if (pauseTimer.current) clearTimeout(pauseTimer.current);
    };
  }, []);

  const studentDetails = user as any;

  // Fix Greeting Details fallbacks
  const greetingName = user?.full_name || 'Student';
  const displayRole = role === 'doctor' ? 'Doctor Workspace' : 'Student Health Portal';
  const roleSubtext = role === 'doctor' 
    ? `Active Specialization: ${studentDetails?.specialization || 'General Practitioner'}`
    : `Program: ${studentDetails?.program || 'B.Tech'} • Branch: ${studentDetails?.branch || 'CSE'} • Hostel: ${studentDetails?.hostel || 'Main Campus'}`;

  // 5 Core Feature modules (Duotone Accent Styling)
  const coreFeatures = [
    {
      to: "/docai",
      icon: <Stethoscope className="w-5 h-5 text-[#2C2C2E]" />,
      title: "DocAI",
      desc: "Symptom analysis diagnostics",
      isSos: false
    },
    {
      to: "/imgdoc",
      icon: <Camera className="w-5 h-5 text-[#2C2C2E]" />,
      title: "Image Diagnosis",
      desc: "Skin / Eye / Tongue scans",
      isSos: false
    },
    {
      to: "/drchat",
      icon: <MessageSquare className="w-5 h-5 text-[#2C2C2E]" />,
      title: "Dr. Consult",
      desc: "Anonymous chat & video calls",
      isSos: false
    },
    {
      to: "/nearby",
      icon: <MapPin className="w-5 h-5 text-[#2C2C2E]" />,
      title: "Nearby Help",
      desc: "Hospitals & Pharmacies map",
      isSos: false
    },
    {
      action: () => setShowSosPopup(true),
      icon: <AlertTriangle className="w-5 h-5 text-[#C4674F]" />,
      title: "Trigger SOS",
      desc: "Share live coordinates",
      isSos: true
    }
  ];

  return (
    <div className="px-6 lg:px-16 py-12 max-w-7xl mx-auto space-y-16 text-left bg-[#FAF8F5] text-[#1D1D1F]">
      
      {/* HERO CONTAINER - NO BOUNDED CARD STRUCTURE */}
      <div className="flex flex-col lg:flex-row gap-12 items-stretch relative">
        
        {/* Left Column: Carousel Image & Description (65%) */}
        <div className="w-full lg:w-[65%] flex flex-col justify-between relative overflow-hidden rounded-[24px] h-[340px] lg:h-[420px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute inset-0 bg-cover bg-center rounded-[24px]"
              style={{ backgroundImage: `url(${carouselItems[activeIndex].img})` }}
            >
              {/* Very subtle gradient overlay at the bottom for text legibility */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent flex flex-col justify-end p-8">
                <motion.h2 
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="text-white text-xl lg:text-2xl font-semibold m-0 tracking-tight"
                >
                  {carouselItems[activeIndex].title}
                </motion.h2>
                <motion.p 
                  initial={{ y: 15, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-zinc-200 text-xs lg:text-sm mt-1.5 font-light max-w-xl leading-relaxed m-0"
                >
                  {carouselItems[activeIndex].caption}
                </motion.p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Greeting & Action Panel (35%) */}
        <div className="w-full lg:w-[35%] flex flex-col justify-between py-2 space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] text-[#6E6E73] font-bold uppercase tracking-widest block">
              {displayRole}
            </span>
            
            {/* Confidence bold layout typography */}
            <h1 className="text-4xl lg:text-5xl font-semibold tracking-tight text-[#1D1D1F] m-0 font-sans leading-none">
              Hello, <br/>{greetingName}.
            </h1>
            
            <p className="text-[#6E6E73] text-sm font-light leading-relaxed m-0 pt-2">
              {roleSubtext}
            </p>
          </div>

          {/* Daily Health Tip in a translucent glass card */}
          <div className="p-5 rounded-[20px] bg-white/70 backdrop-blur-[16px] border border-white/50 space-y-3 shadow-[0_8px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between relative group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-[#D9A15B]" />
                <span className="text-sm font-bold text-[#1D1D1F] font-poppins">Daily Health Tip</span>
              </div>
              <button 
                onClick={() => {
                  const otherTips = healthTips.filter(t => t !== tip);
                  const newTip = otherTips[Math.floor(Math.random() * otherTips.length)];
                  setTip(newTip);
                }}
                className="p-1.5 rounded-lg hover:bg-[#F2EDE4] text-[#6E6E73] hover:text-[#1D1D1F] transition-all cursor-pointer"
                title="Get New Tip"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-[#1D1D1F] leading-relaxed m-0 font-medium min-h-[40px] flex items-center">
              {tip || "Loading daily health tip..."}
            </p>
          </div>

          {/* Pill Button: Solid Graphite with White text */}
          <button
            onClick={() => navigate('/docai')}
            className="w-full bg-[#2C2C2E] hover:bg-[#1D1D1F] text-white font-semibold py-4 px-6 rounded-full text-sm transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <Stethoscope className="w-4 h-4 text-white" />
            Check Symptoms
          </button>
        </div>

      </div>

      {/* THUMBNAIL CAROUSEL STRIP - NO BOXED FRAMES */}
      <div className="space-y-4">
        <div className="flex gap-4 overflow-x-auto py-2 scrollbar-none items-center justify-between">
          {carouselItems.map((item, idx) => {
            const isActive = activeIndex === idx;
            return (
              <div 
                key={idx} 
                onClick={() => handleThumbnailClick(idx)}
                className="flex flex-col flex-1 min-w-[110px] cursor-pointer group"
              >
                {/* Image element only, no boxes */}
                <div 
                  className={`h-[80px] rounded-xl bg-cover bg-center transition-all duration-300 relative ${
                    isActive 
                      ? 'scale-[1.03] opacity-100' 
                      : 'opacity-60 hover:opacity-90'
                  }`}
                  style={{ backgroundImage: `url(${item.img})` }}
                >
                </div>
                
                {/* Underline Indicator - Apple TV style */}
                <div className="w-full h-[2px] bg-[#E5E1DA] mt-3 overflow-hidden rounded-full">
                  {isActive ? (
                    <motion.div 
                      key={activeIndex + "_" + isPaused}
                      initial={{ width: "0%" }}
                      animate={{ width: isPaused ? "0%" : "100%" }}
                      transition={{ duration: isPaused ? 0 : 3, ease: "linear" }}
                      className="h-full bg-[#2C2C2E] rounded-full"
                    />
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* WEATHER & DAILY VITALS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        
        {/* Weather Tip Panel (Translucent Frosted Glass) */}
        <div className="bg-white/70 backdrop-blur-[16px] border border-white/50 rounded-[24px] p-6 flex flex-col justify-between space-y-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider block mb-1">
                JNTU-GV Campus Weather
              </span>
              <span className="text-3xl font-semibold text-[#1D1D1F] font-sans">
                31°C
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F] bg-[#F2EDE4] px-3 py-1.5 rounded-full border border-[#E5E1DA]">
              <Sun className="w-4 h-4 text-[#D9A15B]" />
              Sunny Skies
            </div>
          </div>

          <div className="border-t border-[#E5E1DA] pt-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#7FA88B] uppercase tracking-wider mb-2">
              <span className="w-5 h-5 bg-[#7FA88B]/10 text-[#7FA88B] rounded-full flex items-center justify-center text-xs">💡</span>
              Today's Health Tip
            </div>
            <p className="text-xs text-[#6E6E73] leading-relaxed font-light m-0">
              {tip || "Stay hydrated and get enough sleep."}
            </p>
          </div>
        </div>

        {/* Daily Hydration Widget (Translucent Frosted Glass) */}
        <div className="bg-white/70 backdrop-blur-[16px] border border-white/50 rounded-[24px] p-6 flex flex-col justify-between space-y-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider block mb-1">
                Hydration Tracker
              </span>
              <h4 className="text-3xl font-semibold text-[#1D1D1F] m-0">2.4 L / 3.5 L</h4>
            </div>
            <div className="w-10 h-10 bg-[#F2EDE4] rounded-full flex items-center justify-center">
              <Droplet className="w-5 h-5 text-[#2C2C2E]" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="w-full bg-[#F2EDE4] h-[6px] rounded-full overflow-hidden">
              <div className="bg-[#2C2C2E] h-full rounded-full" style={{ width: '68%' }} />
            </div>
            <span className="text-[11px] font-semibold text-[#7FA88B] block">68% of Daily Target Complete</span>
          </div>
        </div>

        {/* Heart Rate Widget (Translucent Frosted Glass) */}
        <div className="bg-white/70 backdrop-blur-[16px] border border-white/50 rounded-[24px] p-6 flex flex-col justify-between space-y-6 shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-[#6E6E73] uppercase tracking-wider block mb-1">
                Active Vitals Check
              </span>
              <h4 className="text-3xl font-semibold text-[#1D1D1F] m-0">72 BPM</h4>
            </div>
            <div className="w-10 h-10 bg-[#F2EDE4] rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#2C2C2E]" />
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#7FA88B] bg-[#7FA88B]/10 py-1 px-3 rounded-full w-max border border-[#7FA88B]/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7FA88B] animate-ping"></span>
            Normal Heart Rate Logged
          </div>
        </div>

      </div>

      {/* 5 CORE FEATURE CARDS GRID */}
      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
          Smart Health Modules
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {coreFeatures.map((srv, idx) => {
            const cardStyle = srv.isSos
              ? "bg-white border border-[#C4674F]/30 hover:border-[#C4674F] hover:shadow-[0_12px_24px_rgba(196,103,79,0.08)] rounded-[24px] p-6 flex flex-col justify-between h-44 group text-left cursor-pointer transition-all duration-300"
              : "bg-white border border-[#E5E1DA] hover:border-[#2C2C2E]/40 hover:shadow-[0_12px_24px_rgba(0,0,0,0.03)] rounded-[24px] p-6 flex flex-col justify-between h-44 group text-left cursor-pointer transition-all duration-300 hover:-translate-y-1";

            const container = srv.isSos ? (
              <div 
                key={idx}
                onClick={srv.action}
                className={cardStyle}
              >
                <div className="w-10 h-10 bg-[#F9EBE8] text-[#C4674F] rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                  {srv.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-[#C4674F] text-sm m-0">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-[#6E6E73] font-light leading-tight m-0">
                    {srv.desc}
                  </p>
                </div>
              </div>
            ) : (
              <MotionLink
                key={idx}
                to={srv.to || '#'}
                className={cardStyle}
              >
                <div className="w-10 h-10 bg-[#F2EDE4] rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                  {srv.icon}
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-[#1D1D1F] group-hover:text-[#2C2C2E] transition-colors text-sm m-0">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-[#6E6E73] font-light leading-tight m-0">
                    {srv.desc}
                  </p>
                </div>
              </MotionLink>
            );

            return container;
          })}
        </div>
      </div>

      {/* University Medical Notice Board */}
      <motion.div 
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        id="notices" 
        className="bg-white rounded-[24px] border border-[#E5E1DA] p-8 space-y-6 shadow-sm"
      >
        <div className="flex justify-between items-center pb-4 border-b border-[#E5E1DA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#F2EDE4] text-[#2C2C2E] rounded-full flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-semibold text-[#1D1D1F] m-0 tracking-tight">
              JNTU-GV University Medical Notice Board
            </h2>
          </div>
          <span className="text-xs font-semibold text-[#6E6E73]">
            {notices.length} Notices
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {notices.length > 0 ? (
            notices.map((notice, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                key={notice.id} 
                className="p-6 rounded-[20px] border border-[#E5E1DA] bg-white flex flex-col justify-between space-y-4 hover:border-[#2C2C2E]/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      notice.category === 'Camp' 
                        ? 'bg-[#7FA88B]/10 text-[#7FA88B]' 
                        : notice.category === 'Vaccination'
                        ? 'bg-[#2C2C2E]/10 text-[#2C2C2E]'
                        : 'bg-[#D9A15B]/10 text-[#D9A15B]'
                    }`}>
                      {notice.category}
                    </span>
                    <span className="text-xs text-[#6E6E73] flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(notice.date).toLocaleDateString(undefined, {month: 'short', day: 'numeric', year: 'numeric'})}
                    </span>
                  </div>
                  <h3 className="font-semibold text-[#1D1D1F] text-base">
                    {notice.title}
                  </h3>
                  <p className="text-xs text-[#6E6E73] leading-relaxed font-light">
                    {notice.content}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-[#6E6E73] text-sm">
              No health notices available at the moment.
            </div>
          )}
        </div>
      </motion.div>

    </div>
  );
}
