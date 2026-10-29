import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/store';
import { GraduationCap, Heart, ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const { token, updateUser } = useStore();
  const [step, setStep] = useState(1);
  
  // State variables
  const [program, setProgram] = useState<'UG' | 'PG'>('UG');
  const [branch, setBranch] = useState('CSE');
  const [pgDept, setPgDept] = useState('M.Tech - CSE');
  const [hostel, setHostel] = useState('BH-1');
  const [bloodGroup, setBloodGroup] = useState('O+');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    // Submit onboard details
    setError('');
    setLoading(true);
    try {
      const selectedBranch = program === 'UG' ? branch : pgDept;
      const res = await fetch('http://localhost:8000/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          program,
          branch: selectedBranch,
          hostel,
          blood_group: bloodGroup,
          emergency_contact: emergencyContact,
          allergies,
          medical_history: medicalHistory
        })
      });

      if (!res.ok) {
        throw new Error('Onboarding failed. Please try again.');
      }

      const updatedUser = await res.json();
      updateUser(updatedUser);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // Skipping allows entering dashboard, but store doesn't flag onboarded
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-slate-100 via-blue-50 to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-lg glass-card rounded-3xl p-8 relative overflow-hidden transition-all duration-300">
        
        {/* Progress indicator */}
        <div className="flex justify-between items-center mb-8">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            Step {step} of 2
          </span>
          <div className="flex gap-2">
            <div className={`h-1.5 w-12 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
            <div className={`h-1.5 w-12 rounded-full transition-all duration-300 ${step === 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></div>
          </div>
        </div>

        {step === 1 ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto mb-3">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-poppins">
                Academic Profile
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                Tell us about your studies at JNTU-GV Vizianagaram.
              </p>
            </div>

            {/* Program selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Program
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setProgram('UG')}
                  className={`py-3 rounded-2xl border font-semibold text-sm transition-all duration-300 ${
                    program === 'UG'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Undergraduate (UG)
                </button>
                <button
                  type="button"
                  onClick={() => setProgram('PG')}
                  className={`py-3 rounded-2xl border font-semibold text-sm transition-all duration-300 ${
                    program === 'PG'
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Postgraduate (PG)
                </button>
              </div>
            </div>

            {/* Branch / PG Department Selection */}
            {program === 'UG' ? (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Branch
                </label>
                <select
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="CSE">Computer Science & Engineering (CSE)</option>
                  <option value="IT">Information Technology (IT)</option>
                  <option value="ECE">Electronics & Communication Engineering (ECE)</option>
                  <option value="EEE">Electrical & Electronics Engineering (EEE)</option>
                  <option value="MECH">Mechanical Engineering (MECH)</option>
                  <option value="MET">Metallurgical Engineering (MET)</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  PG Department / Specialization
                </label>
                <select
                  value={pgDept}
                  onChange={(e) => setPgDept(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                >
                  <option value="M.Tech - CSE">M.Tech Computer Science</option>
                  <option value="M.Tech - VLSI">M.Tech ECE (VLSI)</option>
                  <option value="M.Tech - Power Systems">M.Tech EEE (Power Systems)</option>
                  <option value="MCA">Master of Computer Applications (MCA)</option>
                  <option value="MBA">Master of Business Administration (MBA)</option>
                </select>
              </div>
            )}

            {/* Hostel Accommodation */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Accomodation / Hostel
              </label>
              <select
                value={hostel}
                onChange={(e) => setHostel(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="BH-1">Boys Hostel - 1 (BH-1)</option>
                <option value="BH-2">Boys Hostel - 2 (BH-2)</option>
                <option value="GH-1">Girls Hostel - 1 (GH-1)</option>
                <option value="GH-2">Girls Hostel - 2 (GH-2)</option>
                <option value="Day Scholar">Day Scholar</option>
              </select>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-3">
                <Heart className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white font-poppins">
                Medical & Emergency
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                This data helps UniMedicine AI and doctors provide accurate suggestions.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Blood Group
                </label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Emergency Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Allergies (If any)
              </label>
              <input
                type="text"
                placeholder="e.g. Dust, Peanut, Penicillin"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                Medical History / Notes
              </label>
              <textarea
                placeholder="e.g. Asthma, Diabetes, Thyroid issues (optional)"
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
              />
            </div>

            {error && (
              <p className="text-sm font-semibold text-rose-500 bg-rose-50 dark:bg-rose-950/20 p-3 rounded-xl text-center">
                {error}
              </p>
            )}
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex gap-4 relative z-10">
          {step === 2 && (
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-6 py-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>
          )}

          <button
            type="button"
            onClick={handleContinue}
            disabled={loading}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-primary to-secondary hover:from-primary-dark hover:to-primary text-white font-semibold text-base shadow-lg shadow-primary/20 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            ) : step === 1 ? (
              <>
                Next Step
                <ChevronRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Complete Setup
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          {step === 1 && (
            <button
              type="button"
              onClick={handleSkip}
              className="px-6 py-3.5 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-semibold hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-all"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
