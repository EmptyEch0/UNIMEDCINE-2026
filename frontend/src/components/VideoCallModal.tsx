import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Shield, Maximize2, Monitor } from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  partnerRole?: string;
  partnerPhoto?: string;
  callType?: 'video' | 'voice';
}

export default function VideoCallModal({
  isOpen,
  onClose,
  partnerName,
  partnerRole = 'Doctor',
  partnerPhoto,
  callType = 'video'
}: VideoCallModalProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'voice');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected'>('connecting');

  // Call timer effect
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isOpen) {
      setCallDuration(0);
      setCallStatus('connecting');
      
      // Simulate WebRTC connection establishment
      const connTimer = setTimeout(() => {
        setCallStatus('connected');
      }, 1500);

      timer = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      return () => {
        clearTimeout(connTimer);
        clearInterval(timer);
      };
    }
  }, [isOpen]);

  // Request camera and microphone media stream
  useEffect(() => {
    if (isOpen) {
      async function startLocalStream() {
        try {
          const constraints = {
            video: callType === 'video',
            audio: true
          };
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          mediaStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (e) {
          console.warn("Camera/Microphone access not granted or not available in current environment:", e);
        }
      }
      startLocalStream();
    } else {
      stopLocalStream();
    }

    return () => {
      stopLocalStream();
    };
  }, [isOpen, callType]);

  const stopLocalStream = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
  };

  const toggleMic = () => {
    if (mediaStreamRef.current) {
      const audioTracks = mediaStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(!isMicMuted);
    } else {
      setIsMicMuted(!isMicMuted);
    }
  };

  const toggleVideo = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    } else {
      setIsVideoOff(!isVideoOff);
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        setIsScreenSharing(true);
        screenStream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          if (localVideoRef.current && mediaStreamRef.current) {
            localVideoRef.current.srcObject = mediaStreamRef.current;
          }
        };
      } catch (e) {
        console.error("Screen share error:", e);
      }
    } else {
      setIsScreenSharing(false);
      if (localVideoRef.current && mediaStreamRef.current) {
        localVideoRef.current.srcObject = mediaStreamRef.current;
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-4xl h-[85vh] bg-slate-900 rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative"
        >
          {/* Top Bar */}
          <div className="p-4 bg-gradient-to-b from-black/60 to-transparent absolute top-0 left-0 right-0 z-20 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm">
                {partnerName.charAt(0)}
              </div>
              <div>
                <h3 className="text-sm font-bold text-white font-poppins flex items-center gap-2">
                  {partnerName}
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                    {callStatus === 'connecting' ? 'Connecting...' : formatDuration(callDuration)}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-400" />
                  Encrypted HD {callType === 'video' ? 'Video' : 'Voice'} Call
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen();
                  } else {
                    document.documentElement.requestFullscreen();
                  }
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
                title="Fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Main Video Stage */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
            
            {/* Remote Stream View (Partner) */}
            <div className="w-full h-full relative flex items-center justify-center">
              {isVideoOff && callType === 'voice' ? (
                <div className="text-center space-y-4">
                  <div className="relative mx-auto">
                    <img
                      src={partnerPhoto || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150'}
                      alt={partnerName}
                      className="w-28 h-28 rounded-full object-cover border-4 border-blue-500/30 shadow-2xl animate-pulse"
                    />
                    <div className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping opacity-25" />
                  </div>
                  <div>
                    <h4 className="text-lg font-extrabold text-white font-poppins">{partnerName}</h4>
                    <p className="text-xs text-slate-400">{partnerRole} • Voice Consultation</p>
                  </div>
                </div>
              ) : (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  poster={partnerPhoto || 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=800'}
                />
              )}
            </div>

            {/* Local Stream View (Self PIP box) */}
            {callType === 'video' && (
              <div className="absolute bottom-6 right-6 w-48 h-36 bg-slate-800 rounded-2xl border-2 border-white/20 shadow-2xl overflow-hidden z-10 group">
                {!isVideoOff ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-slate-400">
                    <VideoOff className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-bold">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-white font-bold">
                  You {isScreenSharing && '(Screen)'}
                </div>
              </div>
            )}
          </div>

          {/* Bottom Control Bar */}
          <div className="p-4 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-center gap-4 z-20">
            {/* Mic Toggle */}
            <button
              onClick={toggleMic}
              className={`p-4 rounded-2xl transition-all ${
                isMicMuted
                  ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                  : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
            >
              {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Video Toggle */}
            {callType === 'video' && (
              <button
                onClick={toggleVideo}
                className={`p-4 rounded-2xl transition-all ${
                  isVideoOff
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
              >
                {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              </button>
            )}

            {/* Screen Share */}
            {callType === 'video' && (
              <button
                onClick={toggleScreenShare}
                className={`p-4 rounded-2xl transition-all ${
                  isScreenSharing
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
              >
                <Monitor className="w-5 h-5" />
              </button>
            )}

            {/* End Call Button */}
            <button
              onClick={() => {
                stopLocalStream();
                onClose();
              }}
              className="p-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold shadow-xl shadow-rose-600/30 transition-all flex items-center gap-2 px-6"
              title="End Call"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-xs font-bold font-poppins">End Call</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
