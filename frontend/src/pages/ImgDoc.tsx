import { useState } from 'react';
import { useStore } from '../store/store';
import { Upload, FileText, CheckCircle, AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';

export default function ImgDoc() {
  const { token } = useStore();
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [organType, setOrganType] = useState('Skin');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<any | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleScan = async () => {
    if (!image) return;
    
    setLoading(true);
    setReport(null);
    
    const formData = new FormData();
    formData.append('file', image);
    formData.append('image_type', organType);

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const res = await fetch('http://localhost:8000/api/ai/scan', {
        method: 'POST',
        headers,
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        // Artificial delay for futuristic scanner feel
        setTimeout(() => {
          setReport(data);
          setLoading(false);
        }, 1500);
      } else {
        throw new Error("Scan failed");
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const resetScanner = () => {
    setImage(null);
    setPreview(null);
    setReport(null);
  };

  return (
    <div className="grid lg:grid-cols-12 gap-8 items-start">
      
      {/* Upload and Scanner Panel */}
      <div className="lg:col-span-5 space-y-6">
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 dark:text-white font-poppins m-0">
              Image Scan Diagnostics
            </h2>
            <p className="text-xs text-slate-400">
              Analyze skin rashes, oral hygiene, nail discoloration, or eye irritation.
            </p>
          </div>

          {/* Organ type selectors */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Select Scan Target
            </span>
            <div className="grid grid-cols-4 gap-2">
              {['Skin', 'Eye', 'Tongue', 'Nails'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrganType(type)}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    organType === type
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Drop Zone */}
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl h-64 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-300 ${
              dragActive 
                ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/20 scale-[1.02]' 
                : preview 
                ? 'border-transparent' 
                : 'border-slate-200 dark:border-slate-800 bg-white/20'
            }`}
          >
            {preview ? (
              <div className="w-full h-full relative group">
                <img src={preview} alt="Scan preview" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300">
                  <button 
                    onClick={resetScanner}
                    className="bg-white text-rose-600 font-bold text-xs px-4 py-2 rounded-xl hover:bg-slate-50 shadow-lg"
                  >
                    Remove Photo
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center p-6 space-y-3">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <label className="text-xs font-bold text-blue-600 hover:underline cursor-pointer block">
                    Upload a file
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1">
                    or drag & drop your scan image here
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          {image && !report && (
            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm rounded-2xl shadow-lg shadow-primary/15 hover:shadow-xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  AI Analyzing Image...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Perform Diagnostic Scan
                </>
              )}
            </button>
          )}

          {report && (
            <button
              onClick={resetScanner}
              className="w-full py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold text-sm rounded-2xl hover:bg-slate-200 transition-all"
            >
              Scan New Image
            </button>
          )}

        </div>
      </div>

      {/* Analysis report output area */}
      <div className="lg:col-span-7">
        {loading ? (
          <div className="glass-card rounded-3xl p-8 space-y-6 animate-pulse">
            <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg w-1/3"></div>
            <div className="h-2 bg-slate-200 dark:bg-slate-800 rounded-full w-full"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              <div className="h-20 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>
            <div className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        ) : report ? (
          <div className="glass-card rounded-3xl p-8 space-y-6 text-left border border-blue-500/10 shadow-2xl relative overflow-hidden">
            
            {/* Background design */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl"></div>

            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">
                  AI SCAN RESULTS
                </span>
                <h3 className="text-2xl font-extrabold text-slate-800 dark:text-white font-poppins">
                  {report.disease}
                </h3>
              </div>
              <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3.5 py-1.5 rounded-xl text-sm font-extrabold shadow-sm">
                Confidence: {report.confidence}
              </div>
            </div>

            {/* Severity and visit doctor metrics */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Severity meter */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Severity Rating
                </span>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-extrabold uppercase ${
                    report.severity === 'Low' 
                      ? 'text-emerald-500' 
                      : report.severity === 'Medium' 
                      ? 'text-amber-500' 
                      : 'text-rose-500'
                  }`}>
                    {report.severity} Severity
                  </span>
                  
                  {/* Visual meter bar */}
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${
                      report.severity === 'Low' 
                        ? 'bg-emerald-500 w-1/3' 
                        : report.severity === 'Medium' 
                        ? 'bg-amber-500 w-2/3' 
                        : 'bg-rose-500 w-full'
                    }`}></div>
                  </div>
                </div>
              </div>

              {/* Consultation required card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800/40">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Doctor Referral
                </span>
                <div className="flex items-center gap-2">
                  {report.should_visit_doctor ? (
                    <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 text-xs font-bold">
                      <ShieldAlert className="w-4.5 h-4.5 text-amber-500" />
                      Consultation Advised
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-bold">
                      <CheckCircle className="w-4.5 h-4.5" />
                      Self-Treatable (Optional Check)
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Explanation */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Explanation & Rationale
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {report.explanation}
              </p>
            </div>

            {/* Suggested medication */}
            <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Suggested Over-the-Counter Treatment
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 font-semibold bg-blue-500/5 dark:bg-blue-500/10 p-3.5 rounded-xl border border-blue-500/10 text-blue-600 dark:text-blue-400 leading-relaxed">
                {report.suggested_medicine}
              </p>
            </div>

            {/* Scan findings lists */}
            {report.findings && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Specific Image Details Detected
                </h4>
                <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-300 space-y-1">
                  {report.findings.map((finding: string, i: number) => (
                    <li key={i}>{finding}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Medical Disclaimer */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider text-center flex items-center justify-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              This image diagnostic report is for demonstration and suggestion. Consult a doctor.
            </div>

          </div>
        ) : (
          <div className="h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl flex flex-col items-center justify-center p-8 text-center text-slate-400">
            <FileText className="w-12 h-12 text-slate-300 mb-2" />
            <h3 className="font-bold text-slate-500 text-sm">
              Diagnosis Report Panel
            </h3>
            <p className="text-xs max-w-sm mt-1">
              Select your organ target, upload or snap a photo of the affected area, and hit analyze to generate report.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}
