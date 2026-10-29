import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/store';
import { 
  Send, Sparkles, RefreshCw, ChevronRight, User, 
  Activity, HeartPulse, Plus, BookOpen, AlertTriangle,
  Smile, Heart, Info, Printer, Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import EcgLoader from '../components/EcgLoader';

import otcGuidance from '../data/otc_guidance.json';

interface ChatMessage {
  id: number;
  sender: 'user' | 'ai';
  text: string;
  isDiagnosticReport?: boolean;
  reportData?: any;
}

export default function DocAI() {
  const { token } = useStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      sender: 'ai',
      text: "Hello! I am UniMedicine's AI Clinical Assistant. Let me help you analyze your symptoms. To begin, select one of the common symptoms below or describe what you are experiencing."
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Diagnostic gathering state
  const [gatheringState, setGatheringState] = useState<'idle' | 'age_gender' | 'duration' | 'submitting'>('idle');
  const [collectedData, setCollectedData] = useState({
    age: '20',
    gender: 'Male',
    symptoms: '',
    duration: '',
  });

  const [companionBubbleText, setCompanionBubbleText] = useState("Hi! Describe your symptoms to start our diagnostic analysis.");

  const handleDoctorClick = () => {
    const greetings = [
      "Hello! Let's analyze your symptoms together.",
      "Tell me how you feel, and I'll compile a diagnostic report.",
      "I'm here to support your health. Go ahead and type your symptoms."
    ];
    setCompanionBubbleText(greetings[Math.floor(Math.random() * greetings.length)]);
  };

  useEffect(() => {
    if (loading) {
      setCompanionBubbleText("I am running a deep clinical diagnostic scan. Just a moment...");
    } else if (gatheringState === 'age_gender') {
      setCompanionBubbleText("Got it! Please share your Age and Gender to tune the matching engine.");
    } else if (gatheringState === 'duration') {
      setCompanionBubbleText("Almost done! How long have you felt these symptoms?");
    } else if (messages.length > 2) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg.isDiagnosticReport) {
        setCompanionBubbleText("Here is my diagnostic report! Please review the conditions and recommendations.");
      } else {
        setCompanionBubbleText("I'm listening closely. Please describe any other symptoms or questions.");
      }
    }
  }, [gatheringState, loading, messages]);

  const presetPrompts = [
    "I have fever",
    "I have headache",
    "I have stomach pain",
    "I have chest pain",
    "I have skin allergy",
    "I have cough"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleStartAnalysis = (symptomText: string) => {
    setCollectedData(prev => ({ ...prev, symptoms: symptomText }));
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text: symptomText },
      { id: Date.now() + 1, sender: 'ai', text: "Let's perform a detailed analysis. Please provide your Age and Gender to proceed." }
    ]);
    setGatheringState('age_gender');
  };

  const handleProvideAgeGender = (age: string, gender: string) => {
    setCollectedData(prev => ({ ...prev, age, gender }));
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text: `Age: ${age}, Gender: ${gender}` },
      { id: Date.now() + 1, sender: 'ai', text: "Got it. How long have you been experiencing these symptoms? (e.g. 2 days, 1 week)" }
    ]);
    setGatheringState('duration');
  };

  const handleProvideDuration = async (durationVal: string) => {
    setCollectedData(prev => ({ ...prev, duration: durationVal }));
    setMessages(prev => [
      ...prev,
      { id: Date.now(), sender: 'user', text: `Duration: ${durationVal}` }
    ]);
    setGatheringState('submitting');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:8000/api/ai/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          age: parseInt(collectedData.age) || 20,
          gender: collectedData.gender,
          symptoms: collectedData.symptoms,
          duration: durationVal,
          temperature: '98.6',
          medical_history: 'None',
          allergies: 'None',
          current_medicines: 'None'
        })
      });

      if (!response.ok) {
        throw new Error("Diagnosis failed");
      }

      const data = await response.json();
      
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 2,
          sender: 'ai',
          text: data.explanation || "I have analyzed your symptoms and compiled a report.",
          isDiagnosticReport: true,
          reportData: data
        }
      ]);
    } catch (e) {
      // Offline Client-Side Diagnostic Engine Fallback
      const symLower = collectedData.symptoms.toLowerCase();
      const matched = otcGuidance.find(item => 
        item.common_symptoms.some((s: string) => symLower.includes(s.toLowerCase()))
      ) || otcGuidance[0];

      const offlineReport = {
        possible_diseases: [{ name: matched.name, probability: "85% (Offline Match)" }],
        explanation: `[OFFLINE CLINICAL REPORT] Based on your reported symptoms '${collectedData.symptoms}' for ${durationVal}, this is indicative of ${matched.name}. Note: App is currently running in Offline Mode.`,
        suggested_medicines: matched.recommended_otc_medicines,
        home_remedies: matched.precautions,
        diet_suggestions: ["Drink warm boiled water", "Eat easily digestible non-spicy meals", "Maintain adequate rest"],
        doctor_recommendation: `Consult the Campus Health Centre or a General Physician if symptoms persist beyond 3 days.`,
        emergency_warning: matched.when_to_see_doctor.join("; ")
      };

      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 3,
          sender: 'ai',
          text: offlineReport.explanation,
          isDiagnosticReport: true,
          reportData: offlineReport
        }
      ]);
    } finally {
      setLoading(false);
      setGatheringState('idle');
    }
  };

  const isGreeting = (text: string) => {
    const greetings = ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'who are you', 'what is this', 'help'];
    const clean = text.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g,"");
    return greetings.includes(clean);
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;
    const text = inputText.trim();
    setInputText('');

    if (gatheringState === 'idle') {
      if (isGreeting(text)) {
        // Direct friendly chat pathway
        setMessages(prev => [
          ...prev,
          { id: Date.now(), sender: 'user', text }
        ]);
        setLoading(true);
        try {
          const res = await fetch('http://localhost:8000/api/ai/diagnose', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              age: -1,
              gender: 'Other',
              symptoms: text,
              duration: '',
              temperature: '',
              medical_history: '',
              allergies: '',
              current_medicines: ''
            })
          });
          if (res.ok) {
            const data = await res.json();
            setMessages(prev => [
              ...prev,
              { id: Date.now() + 1, sender: 'ai', text: data.explanation }
            ]);
          } else {
            throw new Error("Chat failed");
          }
        } catch (e) {
          setMessages(prev => [
            ...prev,
            { id: Date.now() + 1, sender: 'ai', text: "Hello! I am UniMedicine's AI Clinical Assistant. If you have any symptoms to check, please tell me (e.g. I have fever) to begin a clinical analysis." }
          ]);
        } finally {
          setLoading(false);
        }
      } else {
        handleStartAnalysis(text);
      }
    } else if (gatheringState === 'age_gender') {
      const parts = text.split(',');
      const age = parts[0]?.trim() || '20';
      const gender = parts[1]?.trim() || 'Male';
      handleProvideAgeGender(age, gender);
    } else if (gatheringState === 'duration') {
      handleProvideDuration(text);
    }
  };

  return (
    <div className="h-[calc(100vh-140px)] grid grid-cols-1 lg:grid-cols-4 gap-6 mx-4 my-2">
      {/* Left Column: Chat Area */}
      <div className="lg:col-span-3 flex flex-col justify-between bg-white/70 backdrop-blur-[20px] rounded-[26px] overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.04)] relative border border-[#E5E1DA]">
        
        {/* DocAI Banner */}
        <div className="p-5 border-b border-[#E5E1DA] bg-white/50 flex justify-between items-center z-10">
          <div className="flex items-center gap-4">
            <div className="relative group cursor-pointer">
              <img 
                src="/doc_avatar.jpg" 
                alt="Doctor Avatar" 
                className="w-12 h-12 rounded-full object-cover border border-[#E5E1DA] shadow-sm transform group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-[#7FA88B] border-2 border-white rounded-full animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-[#1D1D1F] font-poppins m-0">
                  DocAI Medical Assistant
                </h2>
                <span className="text-[10px] bg-[#7FA88B]/10 text-[#7FA88B] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#7FA88B] rounded-full animate-pulse"></span>
                  Online
                </span>
              </div>
              <div className="hidden md:flex items-center gap-3 mt-1 text-xs text-[#6E6E73] font-medium">
                <span>AI Clinical Assistant</span>
                <span className="w-1 h-1 bg-[#E5E1DA] rounded-full"></span>
                <span>{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span className="w-1 h-1 bg-[#E5E1DA] rounded-full"></span>
                <span>Response &lt;2 sec</span>
                <span className="w-1 h-1 bg-[#E5E1DA] rounded-full"></span>
                <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-[#A89A88]" /> Powered by GPT</span>
              </div>
            </div>
          </div>
          <button 
            onClick={() => {
              setMessages([{
                id: 1,
                sender: 'ai',
                text: "Hello! I am UniMedicine's AI Clinical Assistant. Let me help you analyze your symptoms. To begin, select one of the common symptoms below or describe what you are experiencing."
              }]);
              setGatheringState('idle');
            }}
            className="p-2 rounded-xl hover:bg-[#F2EDE4] transition-colors text-[#6E6E73] hover:text-[#1D1D1F]"
            title="Reset Chat"
          >
            <RefreshCw className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Messages Scrolling Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FAF8F5]/30">
          
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}>
              
              {/* Avatar for AI */}
              {msg.sender === 'ai' && (
                <img 
                  src="/doc_avatar.jpg" 
                  alt="Doctor Avatar" 
                  className="w-10 h-10 rounded-full object-cover border border-[#E5E1DA] shadow-sm flex-shrink-0 cursor-pointer transform hover:scale-110 active:scale-95 transition-all duration-200"
                  onClick={handleDoctorClick}
                />
              )}

              <div className={`max-w-2xl rounded-[22px] p-[22px] shadow-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-[#2C2C2E] text-white rounded-tr-none shadow-md border border-[#1D1D1F]/20'
                  : 'bg-white text-[#1D1D1F] rounded-tl-none border border-[#E5E1DA]'
              }`}>
                <p className="text-sm font-medium leading-relaxed whitespace-pre-line">{msg.text}</p>
                
                {/* If Diagnostic Report card */}
                {msg.isDiagnosticReport && msg.reportData && (
                  <div className="mt-6 border-t border-[#E5E1DA] pt-6 space-y-6">
                    
                    {/* Possible Diseases */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {msg.reportData.possible_diseases?.map((disease: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E5E1DA] animate-card">
                          <span className="text-[9px] text-[#A89A88] uppercase tracking-widest font-extrabold block mb-1">
                            Condition Match
                          </span>
                          <h4 className="font-extrabold text-sm text-[#1D1D1F] font-poppins">
                            {disease.name}
                          </h4>
                          <span className="text-xs font-bold text-[#7FA88B] mt-1 block">
                            Probability: {disease.probability}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Clinical Sections */}
                    <div className="space-y-6 text-left">
                      
                      {/* Suggested Medicines Card Panel */}
                      <div>
                        <h4 className="text-xs font-extrabold text-[#6E6E73] uppercase tracking-wider mb-3 flex items-center gap-1.5 font-poppins">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          Suggested OTC Medicines (Guidance Only)
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {msg.reportData.suggested_medicines?.map((med: any, i: number) => (
                            <div 
                              key={i} 
                              className="p-3.5 rounded-2xl bg-[#FAF8F5]/80 border border-[#E5E1DA] flex flex-col gap-1.5 shadow-sm animate-card"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-extrabold text-xs text-[#1D1D1F] capitalize flex items-center gap-1.5 font-poppins">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                  {med.molecule?.replace(/_/g, ' ')}
                                </span>
                                {med.is_in_nlem && (
                                  <span className="text-[8px] font-bold bg-primary/10 text-primary dark:text-primary-light px-2 py-0.5 rounded-full border border-primary/20 uppercase tracking-wider">
                                    NLEM Essential
                                  </span>
                                )}
                              </div>
                              
                              <p className="text-[11px] text-[#6E6E73] font-medium leading-relaxed">
                                {med.typical_note}
                              </p>
                              
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5 flex items-center gap-1">
                                <span>Age Limits:</span>
                                <span className="text-[#6E6E73] normal-case font-semibold">
                                  {med.age_limits}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Supportive Remedies */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#E5E1DA] pt-4">
                        <div>
                          <h4 className="text-xs font-extrabold text-[#6E6E73] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-poppins">
                            <HeartPulse className="w-3.5 h-3.5 text-[#7FA88B]" />
                            Precautions
                          </h4>
                          <ul className="list-disc list-inside text-xs text-[#1D1D1F] space-y-1">
                            {msg.reportData.home_remedies?.map((rem: string, i: number) => (
                              <li key={i} className="font-medium">{rem}</li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <h4 className="text-xs font-extrabold text-[#6E6E73] uppercase tracking-wider mb-2 flex items-center gap-1.5 font-poppins">
                            <BookOpen className="w-3.5 h-3.5 text-[#D9A15B]" />
                            Diet Recommendations
                          </h4>
                          <ul className="list-disc list-inside text-xs text-[#1D1D1F] space-y-1">
                            {msg.reportData.diet_suggestions?.map((diet: string, i: number) => (
                              <li key={i} className="font-medium">{diet}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Doctor Referral */}
                      <div className="border-t border-[#E5E1DA] pt-4">
                        <h4 className="text-xs font-extrabold text-[#6E6E73] uppercase tracking-wider mb-1 font-poppins">
                          Doctor Referral
                        </h4>
                        <p className="text-xs text-[#1D1D1F] font-semibold">
                          {msg.reportData.doctor_recommendation}
                        </p>
                      </div>

                      {/* Emergency Warning */}
                      {msg.reportData.emergency_warning && (
                        <div className="p-3.5 rounded-2xl bg-[#F9EBE8] border border-[#C4674F]/20 text-[#C4674F] flex gap-2.5 items-start">
                          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <div>
                            <h4 className="font-extrabold text-xs uppercase tracking-wider mb-0.5 font-poppins">
                              Emergency Warning
                            </h4>
                            <p className="text-xs font-semibold leading-relaxed">
                              {msg.reportData.emergency_warning}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Export Printable Summary Action */}
                    <div className="pt-4 border-t border-[#E5E1DA] flex justify-between items-center gap-3">
                      <button
                        onClick={() => {
                          const printWin = window.open('', '_blank');
                          if (printWin) {
                            printWin.document.write(`
                              <html>
                                <head>
                                  <title>UniMedicine AI Clinical Diagnostic Report</title>
                                  <style>
                                    body { font-family: sans-serif; padding: 40px; color: #1D1D1F; }
                                    .header { border-bottom: 2px solid #2f7fc1; padding-bottom: 10px; margin-bottom: 20px; }
                                    .title { font-size: 24px; font-weight: bold; color: #2f7fc1; }
                                    .section { margin-bottom: 20px; }
                                    .section-title { font-size: 14px; font-weight: bold; color: #6E6E73; text-transform: uppercase; margin-bottom: 8px; }
                                    .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 10px; margin-bottom: 10px; }
                                    .warning { background: #fff1f2; border: 1px solid #fecdd3; color: #e11d48; padding: 12px; border-radius: 10px; font-weight: bold; }
                                    .footer { border-top: 1px solid #e2e8f0; margin-top: 40px; pt-10px; font-size: 10px; color: #94a3b8; text-align: center; }
                                  </style>
                                </head>
                                <body>
                                  <div class="header">
                                    <div class="title">JNTU-GV UNIMEDICINE</div>
                                    <div>AI Clinical Diagnostic Checkup Summary • ${new Date().toLocaleDateString()}</div>
                                  </div>
                                  <div class="section">
                                    <div class="section-title font-bold">Diagnostic Findings & Condition Matches</div>
                                    ${msg.reportData.possible_diseases?.map((d: any) => `
                                      <div class="card">
                                        <strong>${d.name}</strong> — Match Likelihood: <strong>${d.probability}</strong>
                                      </div>
                                    `).join('')}
                                  </div>
                                  <div class="section">
                                    <div class="section-title font-bold">Clinical Assessment Paragraph</div>
                                    <p>${msg.reportData.explanation}</p>
                                  </div>
                                  <div class="section">
                                    <div class="section-title font-bold">Suggested OTC Self-Care Options</div>
                                    ${msg.reportData.suggested_medicines?.map((m: any) => `
                                      <div class="card">
                                        <strong>${typeof m === 'string' ? m : m.molecule}</strong> — ${typeof m === 'string' ? 'OTC option' : m.typical_note}
                                      </div>
                                    `).join('')}
                                  </div>
                                  <div class="section">
                                    <div class="section-title font-bold">Doctor Referral Guidance</div>
                                    <p>${msg.reportData.doctor_recommendation || 'Consult Campus Physician if symptoms persist.'}</p>
                                  </div>
                                  ${msg.reportData.emergency_warning ? `
                                    <div class="warning">
                                      ⚠️ Emergency Warning: ${msg.reportData.emergency_warning}
                                    </div>
                                  ` : ''}
                                  <div class="footer">
                                    This report was compiled by UniMedicine AI Diagnostic Engine for clinical guidance. Consult a medical practitioner.
                                  </div>
                                  <script>window.onload = function() { window.print(); }</script>
                                </body>
                              </html>
                            `);
                            printWin.document.close();
                          }
                        }}
                        className="w-full py-3 bg-[#2C2C2E] hover:bg-[#1D1D1F] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Printer className="w-4 h-4 text-primary" />
                        Export Printable Clinical Report (PDF)
                      </button>
                    </div>

                    {/* Medical Disclaimer */}
                    <div className="pt-4 border-t border-[#E5E1DA] text-[9px] font-bold text-[#A89A88] uppercase tracking-wider text-center">
                      ⚠️ This is an AI generated health suggestion and not a medical diagnosis.
                    </div>

                  </div>
                )}
              </div>

              {/* Avatar for User */}
              {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary flex-shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}

            </div>
          ))}

          {loading && (
            <div className="flex justify-start gap-3 items-start">
              <img 
                src="/doc_avatar.jpg" 
                alt="Doctor Avatar" 
                className="w-10 h-10 rounded-full object-cover border border-[#E5E1DA] shadow-sm flex-shrink-0 animate-bounce"
              />
              <div className="bg-white rounded-[22px] rounded-tl-none p-4 shadow-sm flex items-center gap-2 border border-[#E5E1DA]">
                <EcgLoader />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Grid */}
        {messages.length === 1 && gatheringState === 'idle' && (
          <div className="p-4 bg-white/40 border-t border-[#E5E1DA]">
            <span className="text-[10px] font-extrabold text-[#A89A88] uppercase tracking-wider block mb-2">
              Suggested Symptoms
            </span>
            <div className="flex flex-wrap gap-2">
              {presetPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleStartAnalysis(prompt)}
                  className="bg-white hover:bg-[#F2EDE4] border border-[#E5E1DA] px-4 py-2 rounded-xl text-xs font-semibold text-[#1D1D1F] shadow-sm hover:shadow-md hover:border-[#A89A88]/30 transition-all flex items-center gap-1.5 animate-btn"
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Prompt collectors (gatheringState helper cards) */}
        {gatheringState !== 'idle' && gatheringState !== 'submitting' && (
          <div className="p-4 bg-[#FAF8F5] border-t border-[#E5E1DA] flex justify-between items-center gap-4 z-10">
            
            {gatheringState === 'age_gender' && (
              <div className="flex flex-1 items-center gap-3">
                <span className="text-xs font-semibold text-[#1D1D1F]">
                  Age:
                </span>
                <input 
                  type="number" 
                  defaultValue="20" 
                  id="age_input"
                  onChange={(e) => setCollectedData(prev => ({ ...prev, age: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleProvideAgeGender((e.target as HTMLInputElement).value || '20', collectedData.gender)}
                  className="w-16 px-2.5 py-1.5 rounded-lg border border-[#E5E1DA] bg-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2C2C2E]/30" 
                />
                <span className="text-xs font-semibold text-[#1D1D1F]">
                  Gender:
                </span>
                <select 
                  onChange={(e) => setCollectedData(prev => ({ ...prev, gender: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleProvideAgeGender(collectedData.age, (e.target as HTMLSelectElement).value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[#E5E1DA] bg-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2C2C2E]/30"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
                <button 
                  onClick={() => handleProvideAgeGender(collectedData.age, collectedData.gender)}
                  className="ml-auto bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-primary-dark transition-all shadow-md shadow-primary/10 animate-btn"
                >
                  Confirm
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {gatheringState === 'duration' && (
              <div className="flex flex-1 items-center gap-3">
                <span className="text-xs font-semibold text-[#1D1D1F]">
                  How long?
                </span>
                <input 
                  type="text" 
                  placeholder="e.g. 2 days, 1 week" 
                  id="duration_input"
                  onChange={(e) => setCollectedData(prev => ({ ...prev, duration: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && handleProvideDuration((e.target as HTMLInputElement).value || '3 days')}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-[#E5E1DA] bg-white text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#2C2C2E]/30" 
                />
                <button 
                  onClick={() => handleProvideDuration(collectedData.duration)}
                  className="bg-primary text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1 hover:bg-primary-dark transition-all shadow-md shadow-primary/10 animate-btn"
                >
                  Confirm
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

          </div>
        )}

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-[#E5E1DA] bg-white/50 flex gap-3 items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              gatheringState === 'idle' 
                ? "Describe your symptoms (e.g. I have mild stomach ache)..."
                : gatheringState === 'age_gender'
                ? "Enter: Age, Gender (e.g. 21, Female)..."
                : "Enter duration (e.g. 3 days)..."
            }
            className="flex-1 px-4 py-3 rounded-2xl border border-[#E5E1DA] bg-white/50 text-[#1D1D1F] text-sm focus:outline-none focus:ring-2 focus:ring-[#2C2C2E]/20 transition-all"
          />
          <button
            onClick={handleSend}
            className="w-12 h-12 bg-[#2C2C2E] text-white rounded-2xl flex items-center justify-center shadow-md shadow-primary/20 hover:bg-[#1D1D1F] transition-colors animate-btn cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Right Column: Interactive Doctor Assistant Companion Card */}
      <div className="hidden lg:flex flex-col items-center justify-between p-6 bg-white/70 backdrop-blur-[20px] rounded-[26px] border border-[#E5E1DA] shadow-[0_18px_50px_rgba(0,0,0,0.04)] relative overflow-hidden text-center">
        {/* Background radial highlight */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#A89A88]/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="w-full space-y-6 flex-1 flex flex-col items-center justify-center">
          {/* Doctor Header */}
          <div>
            <span className="text-[10px] font-extrabold text-[#A89A88] uppercase tracking-widest block mb-1">
              DocAI Companion
            </span>
            <p className="text-[11px] text-[#6E6E73] font-medium mt-0.5">
              Your Dedicated AI Assistant
            </p>
          </div>

          {/* Large Doctor Avatar with pulse rings & interactive hover */}
          <motion.div 
            onClick={handleDoctorClick}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-36 h-36 rounded-full overflow-hidden border-2 border-[#E5E1DA] shadow-md cursor-pointer group"
          >
            {/* Pulse ring indicator */}
            <div className="absolute inset-0 rounded-full border border-[#A89A88]/30 group-hover:scale-110 transition-transform duration-300 pointer-events-none" />
            <img 
              src="/doc_avatar.jpg" 
              alt="DocAI Companion" 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </motion.div>

          {/* Dynamic Interactive Speech Bubble */}
          <div className="relative w-full max-w-[200px]">
            <div className="bg-[#F2EDE4]/70 border border-[#E5E1DA] p-3.5 rounded-2xl text-xs text-[#1D1D1F] font-medium leading-relaxed shadow-sm relative">
              <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#F2EDE4]/70 border-t border-l border-[#E5E1DA] rotate-45" />
              <p className="whitespace-pre-line">{companionBubbleText}</p>
            </div>
          </div>
        </div>

        {/* Footer info inside the card */}
        <div className="w-full pt-4 border-t border-[#E5E1DA] mt-4 flex justify-between items-center px-2 text-[9px] text-[#A89A88] font-bold uppercase tracking-wider">
          <span className="flex items-center gap-1"><Heart className="w-2.5 h-2.5 text-[#C4674F] fill-[#C4674F]" /> Hippocratic AI</span>
          <span>V1.0</span>
        </div>
      </div>
    </div>
  );
}
