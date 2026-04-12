import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { FileText, MapPin, Pill, Activity, ArrowRight, UploadCloud, CheckCircle2, AlertTriangle, X, ScanFace, Languages, HeartPulse, Stethoscope, ShieldCheck, Globe, Volume2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Translation Context
const LanguageContext = createContext();

const translations = {
  en: {
    heroTitle1: "Understand your",
    heroTitle2: "prescription.",
    heroTitle3: "Instantly.",
    heroDesc: "Upload a photo of your messy handwritten prescription and get a beautifully simple care guide, interaction warnings, and dosage reminders.",
    cta: "Start Scanning Now",
    openApp: "Open App",
    howItWorks: "How MedBridge Works",
    howItWorksDesc: "A seamless pipeline turning confusion into clarity.",
    feature1Title: "AI Vision Scanning",
    feature1Desc: "Take a photo of your prescription. Our Medical OCR digitizes handwriting into legible text.",
    feature2Title: "FDA Interaction Checker",
    feature2Desc: "Cross-references every medicine against live FDA databases to warn you about dangerous combinations.",
    feature3Title: "Native Translation",
    feature3Desc: "Read medical instructions securely in Hindi, Bengali, Tamil, or your comfort language.",
    feature4Title: "Live Pharmacy Locator",
    feature4Desc: "Instantly routes you to the nearest open pharmacies to collect your verified prescription.",
    processing: "AI is verifying document...",
    mapping: "Extracting entities & mapping FDA safety limits",
    careGuide: "Your Care Guide",
    personalized: "Personalized insights",
    needMeds: "Need medicines now?",
    viewMap: "View Global Map",
    uploadTitle: "Upload Prescription",
    uploadDesc: "Drag & drop or snap a picture of your handwritten document.",
    processBtn: "Process with AI",
    interactionWarning: "Drug Interaction Warning"
  },
  hi: {
    heroTitle1: "अपनी",
    heroTitle2: "नुस्खे (Prescription)",
    heroTitle3: "को तुरंत समझें।",
    heroDesc: "अपने हाथ से लिखे गए नुस्खे की एक फोटो अपलोड करें और एक सरल देखभाल मार्गदर्शिका, दवा चेतावनी और खुराक अनुस्मारक प्राप्त करें।",
    cta: "अभी स्कैन करना शुरू करें",
    openApp: "ऐप खोलें",
    howItWorks: "MedBridge कैसे काम करता है",
    howItWorksDesc: "भ्रम को स्पष्टता में बदलने का एक सहज जरिया।",
    feature1Title: "AI विजन स्कैनिंग",
    feature1Desc: "अपने नुस्खे का एक फोटो लें। हमारा मेडिकल OCR लिखावट को पढ़ने योग्य टेक्स्ट में बदल देता है।",
    feature2Title: "FDA इंटरेक्शन चेकर",
    feature2Desc: "खतरनाक संयोजनों के बारे में चेतावनी देने के लिए हर दवा की तुलना लाइव FDA डेटाबेस से करता है।",
    feature3Title: "देशी भाषा अनुवाद",
    feature3Desc: "हिंदी, बंगाली, तमिल या अपनी पसंदीदा भाषा में सुरक्षित रूप से चिकित्सा निर्देश पढ़ें।",
    feature4Title: "लाइव फार्मेसी लोकेटर",
    feature4Desc: "आपको निकटतम खुली फार्मेसियों तक तुरंत पहुँच प्रदान करता है।",
    processing: "AI दस्तावेज़ को सत्यापित कर रहा है...",
    mapping: "इकाइयों को निकालना और FDA सुरक्षा सीमाएं मैपिंग",
    careGuide: "आपकी केयर गाइड",
    personalized: "व्यक्तिगत अंतर्दृष्टि",
    needMeds: "दवाओं की अभी ज़रूरत है?",
    viewMap: "ग्लोबल मैप देखें",
    uploadTitle: "नुस्खा अपलोड करें",
    uploadDesc: "खींचे और छोड़ें या अपने दस्तावेज़ की तस्वीर लें।",
    processBtn: "AI के साथ प्रोसेस करें",
    interactionWarning: "दवाओं का प्रभाव (Drug Interaction)"
  },
  ta: {
    heroTitle1: "உங்கள்",
    heroTitle2: "மருந்துச் சீட்டை",
    heroTitle3: "உடனடியாகப் புரிந்து கொள்ளுங்கள்.",
    heroDesc: "உங்கள் கையெழுத்து மருந்துச் சீட்டைப் பதிவேற்றி, எளிய பராமரிப்பு வழிகாட்டி மற்றும் மருந்து எச்சரிக்கைகளைப் பெறுங்கள்.",
    cta: "இப்போதே ஸ்கேன் செய்யத் தொடங்குங்கள்",
    openApp: "பயன்பாட்டைத் திற",
    howItWorks: "MedBridge எப்படி வேலை செய்கிறது",
    feature1Title: "AI விஷன் ஸ்கேனிங்",
    feature2Title: "FDA தொடர்பு சரிபார்ப்பு",
    interactionWarning: "மருந்து தொடர்பு எச்சரிக்கை"
  },
  bn: {
    interactionWarning: "ওষুধের মিথস্ক্রিয়া"
  },
  te: {
    interactionWarning: "డ్రగ్ ఇంటరాక్షన్"
  }
};

// Custom Cursor Component
function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorXSpring = useSpring(cursorX, springConfig);
  const cursorYSpring = useSpring(cursorY, springConfig);

  useEffect(() => {
    const moveCursor = (e) => {
      cursorX.set(e.clientX - 16);
      cursorY.set(e.clientY - 16);
    };
    window.addEventListener('mousemove', moveCursor);
    return () => {
      window.removeEventListener('mousemove', moveCursor);
    };
  }, []);

  return (
    <motion.div
      id="custom-cursor"
      className="fixed top-0 left-0 w-8 h-8 rounded-full border-2 border-brand-400 bg-brand-500/20 mix-blend-screen pointer-events-none z-[9999] flex items-center justify-center"
      style={{ x: cursorXSpring, y: cursorYSpring }}
    >
      <div className="w-1.5 h-1.5 bg-brand-400 rounded-full"></div>
    </motion.div>
  );
}

// 3D Tilt Card Component for Feature Grid
function TiltCard({ children, className }) {
  return (
    <motion.div
      whileHover={{ y: -10, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`glass-panel rounded-3xl p-8 relative overflow-hidden group ${className}`}
    >
      <div className="absolute inset-0 bg-gradient-to-tr from-brand-500/0 via-brand-500/0 to-brand-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      {children}
    </motion.div>
  );
}

// Landing Page
function LandingPage() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useContext(LanguageContext);

  return (
    <div className="min-h-screen bg-dark-900 overflow-hidden relative font-sans text-slate-100">
      {/* Dynamic Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-600/30 rounded-full blur-[120px] animate-pulse-glow pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-600/20 rounded-full blur-[100px] pointer-events-none"></div>

      <nav className="relative z-50 px-6 sm:px-12 py-6 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] group hover:scale-110 transition-transform duration-500">
            <Activity className="text-white w-7 h-7 stroke-[2.5]" />
          </div>
          <span className="text-2xl font-black tracking-tight text-white group cursor-pointer">
            Med<span className="text-brand-400">Bridge</span>
          </span>
        </div>
        
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="hidden md:flex items-center gap-2 bg-white/5 px-2 py-1.5 rounded-2xl border border-white/5 glass-panel">
            {['en', 'hi', 'ta', 'bn'].map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 ${lang === l ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/app')}
            className="btn-primary flex items-center gap-2"
          >
            <ScanFace className="w-5 h-5" />
            <span className="hidden sm:inline">{t('openApp')}</span>
          </motion.button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 pt-24 pb-32 grid lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-8 z-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-pill text-brand-100/90 text-sm font-medium border border-brand-500/30"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-500"></span>
            </span>
            <span>AI-Powered Prescription Vision</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[1] tracking-tighter"
          >
            {t('heroTitle1')} <br /> 
            <span className="text-gradient">
              {t('heroTitle2')}
            </span> <br />
            {t('heroTitle3')}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-400 max-w-xl leading-relaxed font-medium"
          >
            {t('heroDesc')}
          </motion.p>
          
          <div className="flex flex-wrap gap-5">
            <motion.button 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/app')}
              className="btn-primary flex items-center gap-3 group"
            >
              {t('cta')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </motion.button>
            
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="btn-glass flex items-center gap-2"
            >
              <Activity className="w-5 h-5 text-brand-400" />
              <span>Live Health Analytics</span>
            </motion.button>
          </div>
        </div>

        {/* Hero Visual Mockup instead of Spline iframe */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="relative w-full h-[500px] lg:h-[600px] flex items-center justify-center lg:justify-end"
        >
           {/* Abstract Floating Elements mimicking 3D */}
           <motion.div animate={{ y: [0, -20, 0] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} className="absolute z-30 top-10 left-10 lg:-left-10 w-24 h-24 glass-pill rounded-2xl flex items-center justify-center border border-white/20 shadow-2xl">
              <Stethoscope className="w-10 h-10 text-accent-400" />
           </motion.div>
           
           <motion.div animate={{ y: [0, 20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute z-30 bottom-20 right-0 w-20 h-20 glass-pill rounded-full flex items-center justify-center border border-brand-400/30 shadow-2xl shadow-brand-500/20 bg-dark-800">
              <Pill className="w-8 h-8 text-brand-400" />
           </motion.div>

           {/* Main Glass Mockup Card */}
           <div className="w-full max-w-md relative z-20 glass-panel rounded-[2.5rem] p-6 border-t border-l border-white/20 shadow-[0_30px_60px_rgba(0,0,0,0.6)] animate-float">
              <div className="w-full h-48 bg-dark-900 rounded-2xl mb-6 relative overflow-hidden border border-white/5 flex items-center justify-center">
                 <ScanFace className="w-16 h-16 text-slate-700 absolute" />
                 {/* Scanning beam effect */}
                 <motion.div 
                   animate={{ top: ['0%', '100%', '0%'] }} 
                   transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                   className="absolute left-0 w-full h-1 bg-brand-400 shadow-[0_0_20px_#22d3ee]"
                 ></motion.div>
              </div>
              <div className="space-y-4">
                 <div className="h-6 w-3/4 bg-slate-800 rounded-md"></div>
                 <div className="h-4 w-full bg-slate-800 rounded-md"></div>
                 <div className="h-4 w-5/6 bg-slate-800 rounded-md"></div>
                 
                 <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                      <ShieldCheck className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <div className="h-3 w-32 bg-slate-700 rounded mb-2"></div>
                      <div className="h-2 w-24 bg-slate-800 rounded"></div>
                    </div>
                 </div>
              </div>
           </div>
        </motion.div>
      </main>

      <section className="relative z-10 max-w-7xl mx-auto px-6 sm:px-12 py-20 pb-40">
         <div className="mb-16">
           <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-white mb-4">{t('howItWorks')}</h2>
           <p className="text-slate-400 text-lg">{t('howItWorksDesc')}</p>
         </div>
         
         <div className="grid md:grid-cols-3 gap-6">
           <TiltCard className="col-span-1 md:col-span-2">
             <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6">
               <ScanFace className="w-7 h-7 text-brand-400" />
             </div>
             <h3 className="text-2xl font-bold mb-3 text-white">{t('feature1Title')}</h3>
             <p className="text-slate-400 text-lg leading-relaxed">
               {t('feature1Desc')}
             </p>
           </TiltCard>
           
           <TiltCard className="col-span-1 border border-accent-500/20 bg-accent-900/10">
             <div className="w-14 h-14 rounded-2xl bg-accent-500/10 flex items-center justify-center mb-6">
               <ShieldCheck className="w-7 h-7 text-accent-400" />
             </div>
             <h3 className="text-2xl font-bold mb-3 text-white">{t('feature2Title')}</h3>
             <p className="text-slate-400 text-lg">
               {t('feature2Desc')}
             </p>
           </TiltCard>

           <TiltCard className="col-span-1 md:col-span-1">
             <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
               <Languages className="w-7 h-7 text-emerald-400" />
             </div>
             <h3 className="text-xl font-bold mb-3 text-white">{t('feature3Title')}</h3>
             <p className="text-slate-400">
               {t('feature3Desc')}
             </p>
           </TiltCard>

           <TiltCard className="col-span-1 md:col-span-2 overflow-hidden relative">
             <div className="relative z-10 w-full md:w-2/3">
               <div className="w-14 h-14 rounded-2xl bg-brand-500/10 flex items-center justify-center mb-6">
                 <MapPin className="w-7 h-7 text-brand-400" />
               </div>
               <h3 className="text-2xl font-bold mb-3 text-white">{t('feature4Title')}</h3>
               <p className="text-slate-400 text-lg">
                 {t('feature4Desc')}
               </p>
             </div>
             <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none translate-x-1/4 translate-y-1/4">
               <HeartPulse className="w-96 h-96 text-white" />
             </div>
           </TiltCard>
         </div>
      </section>
    </div>
  );
}

// App Page
function ScanApp() {
  const navigate = useNavigate();
  const { lang, setLang, t } = useContext(LanguageContext);
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [showMap, setShowMap] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [isLocating, setIsLocating] = useState(false);

  const speakText = (text, langCode) => {
    if (!('speechSynthesis' in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voiceMap = { 'en': 'en-US', 'hi': 'hi-IN', 'ta': 'ta-IN', 'bn': 'bn-IN', 'te': 'te-IN' };
    utterance.lang = voiceMap[langCode] || 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleMapOpen = () => {
    setIsLocating(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.latitude, position.coords.longitude]);
          setShowMap(true);
          setIsLocating(false);
        },
        (error) => {
          console.error("Location error:", error);
          setUserLocation([19.0760, 72.8777]);
          setShowMap(true);
          setIsLocating(false);
        },
        { timeout: 5000, maximumAge: 0 }
      );
    } else {
      setUserLocation([19.0760, 72.8777]);
      setShowMap(true);
      setIsLocating(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await fetch('/api/scan', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      console.log('API Response:', data);
      
      if (data && data.medicines && data.medicines.length > 0) {
        setResult(data);
      } else {
        const errorMsg = data?.error || 'Could not extract medicines. Please try a clearer, well-lit photo.';
        alert(errorMsg);
        setFile(null);
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to connect to backend. Make sure the server is running on port 5000.');
      setFile(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTranslate = async (l) => {
    setTargetLanguage(l);
    if (!result) return;
    
    setIsProcessing(true);
    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_language: l, medicines: result.medicines })
      });
      const data = await response.json();
      if(data.translated_medicines) {
        setResult(prev => ({...prev, medicines: data.translated_medicines}));
      }
    } catch(err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="min-h-screen bg-dark-900 pb-20 relative font-sans text-slate-200">
      <nav className="px-6 py-4 border-b border-white/5 bg-dark-900/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center shadow-lg">
        <a href="/" className="flex items-center gap-2 group">
          <div className="p-2 rounded-lg bg-white/5 group-hover:bg-brand-500/20 transition-colors">
            <Activity className="text-brand-400 w-5 h-5" />
          </div>
          <span className="text-lg font-black text-white tracking-tight">MedBridge</span>
        </a>
        
        <div className="flex items-center gap-4">
           <Globe className="text-slate-500 w-5 h-5 hidden sm:block" />
           <select 
             value={lang} 
             onChange={(e) => setLang(e.target.value)}
             className="bg-dark-800 border border-white/10 text-white px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 ring-brand-500/50"
           >
             <option value="en">English</option>
             <option value="hi">हिंदी (Hindi)</option>
             <option value="ta">தமிழ் (Tamil)</option>
             <option value="bn">বাংলা (Bengali)</option>
             <option value="te">తెలుగు (Telugu)</option>
           </select>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16">
        {!result && !isProcessing && (
          <motion.div 
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-10 sm:p-24 text-center rounded-[3rem] border-2 border-dashed border-white/10 hover:border-brand-500/50 transition-all group hover:shadow-[0_0_80px_rgba(6,182,212,0.1)] relative overflow-hidden"
          >
             <div className="absolute inset-0 bg-gradient-to-b from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
             
             {/* Only show full-card file input when NO file is selected */}
             {!file && (
               <input 
                 type="file" 
                 id="file" 
                 accept="image/*" 
                 className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
                 aria-label={t('uploadTitle')} 
                 onChange={(e) => setFile(e.target.files[0])} 
               />
             )}
             
             <div className="space-y-8 relative z-10">
                <div className="w-28 h-28 mx-auto rounded-[2rem] bg-dark-900 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-700 shadow-2xl border border-white/5 relative">
                  <div className="absolute inset-0 bg-brand-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <UploadCloud className="w-14 h-14 text-brand-400 relative z-10" />
                </div>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black mb-4 text-white tracking-tight">
                    {file ? file.name : t('uploadTitle')}
                  </h3>
                  <p className="text-slate-400 text-xl max-w-lg mx-auto leading-relaxed">
                    {file ? "Ready to decode this prescription." : t('uploadDesc')}
                  </p>
                </div>
                {file && (
                  <div className="flex items-center justify-center gap-4">
                    <motion.button 
                      initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                      onClick={handleUpload}
                      className="btn-primary"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="w-6 h-6" />
                        <span>{t('processBtn')}</span>
                      </div>
                    </motion.button>
                    <button 
                      onClick={() => setFile(null)}
                      className="px-6 py-3 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:border-white/30 transition-all font-bold text-sm"
                    >
                      Change File
                    </button>
                  </div>
                )}
             </div>
          </motion.div>
        )}

        {isProcessing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-40 space-y-12">
             <div className="relative w-40 h-40">
                <div className="absolute inset-0 border-[6px] border-brand-500/10 rounded-full"></div>
                <div className="absolute inset-0 border-[6px] border-brand-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-4 border-[1px] border-white/10 rounded-full animate-pulse-glow"></div>
                <ScanFace className="absolute inset-0 m-auto w-14 h-14 text-brand-400 animate-pulse" />
             </div>
             <div className="text-center space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tight">{t('processing')}</h2>
                <div className="flex items-center justify-center gap-3">
                  <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce"></div>
                  <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce delay-100"></div>
                  <div className="h-1.5 w-1.5 bg-brand-500 rounded-full animate-bounce delay-200"></div>
                  <p className="text-brand-400 font-bold uppercase tracking-widest text-xs">{t('mapping')}</p>
                </div>
             </div>
          </motion.div>
        )}

        {result && !isProcessing && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-12">
             <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 bg-dark-800/40 p-8 rounded-[2.5rem] border border-white/5 glass-panel">
               <div className="space-y-2">
                 <h2 className="text-4xl font-black text-white tracking-tight">{t('careGuide')}</h2>
                 <div className="flex items-center gap-3">
                    <span className="flex h-2 w-2 rounded-full bg-brand-500 animate-pulse"></span>
                    <p className="text-brand-400 font-bold uppercase tracking-widest text-xs">{t('personalized')}</p>
                 </div>
               </div>

               <div className="flex flex-wrap gap-2 bg-dark-900/60 p-1.5 rounded-2xl border border-white/5">
                 {['en', 'hi', 'ta', 'bn', 'te'].map((l) => (
                    <button 
                      key={l} 
                      onClick={() => handleTranslate(l)} 
                      className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all duration-300 ${targetLanguage === l ? 'bg-brand-500 text-white shadow-lg' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                    >
                      {l === 'en' ? 'ENGLISH' : l === 'hi' ? 'हिंदी' : l === 'ta' ? 'தமிழ்' : l === 'bn' ? 'বাংলা' : 'తెలుగు'}
                    </button>
                 ))}
               </div>
             </div>

             <div className="grid gap-8">
                {result.medicines.map((med, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
                    key={idx} 
                    className={`glass-panel p-10 rounded-[2.5rem] relative overflow-hidden group transition-all duration-500 ${med.interaction_flag ? 'border-rose-500/30' : 'hover:border-brand-500/30'}`}
                  >
                    {med.interaction_flag && (
                      <div className="absolute top-0 left-0 w-2 h-full bg-gradient-to-b from-rose-500 to-rose-700 shadow-[0_0_20px_rgba(244,63,94,0.4)]"></div>
                    )}
                    
                    <div className="grid lg:grid-cols-3 gap-12">
                      <div className="lg:col-span-2 space-y-8">
                        <div className="flex flex-wrap items-center gap-6">
                           <div className="w-20 h-20 rounded-[1.5rem] bg-dark-900 border border-white/5 flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500 relative">
                              <div className="absolute inset-0 bg-brand-500/10 blur-xl rounded-full"></div>
                              <Pill className="text-brand-400 w-10 h-10 relative z-10" />
                           </div>
                           <div className="space-y-1">
                             <div className="flex items-center gap-3">
                               <h3 className="text-3xl font-black text-white tracking-tight">{med.name}</h3>
                               <button
                                 onClick={() => speakText(`${med.name}. ${med.dosage}. ${med.purpose}.`, targetLanguage)}
                                 className="p-2 rounded-full bg-slate-800/80 hover:bg-brand-500/20 text-brand-400 transition-colors"
                                 title="Listen"
                                 aria-label="Listen to medicine info"
                               >
                                  <Volume2 className="w-5 h-5" />
                               </button>
                             </div>
                             <div className="flex items-center gap-3">
                               <span className="text-xs font-black text-white bg-brand-500 px-4 py-1.5 rounded-full tracking-widest">{med.dosage}</span>
                               {med.interaction_flag && (
                                 <span className="text-[10px] font-black text-rose-500 border border-rose-500/50 px-3 py-1 rounded-full tracking-widest uppercase">High Alert</span>
                               )}
                             </div>
                           </div>
                        </div>
                        
                        <div className="space-y-4">
                          <p className="text-xl text-slate-200 leading-relaxed font-semibold italic">"{med.purpose}"</p>
                          <div className="flex flex-wrap gap-3">
                             <div className="px-4 py-2 rounded-xl bg-dark-800/80 border border-white/5 text-slate-400 text-sm font-bold flex items-center gap-2">
                               <Activity className="w-4 h-4 text-brand-400" />
                               {med.frequency}
                             </div>
                             <div className="px-4 py-2 rounded-xl bg-dark-800/80 border border-white/5 text-slate-400 text-sm font-bold flex items-center gap-2">
                               <HeartPulse className="w-4 h-4 text-emerald-400" />
                               {med.duration}
                             </div>
                          </div>
                        </div>

                        {med.interaction_flag && (
                          <div className="mt-6 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex gap-4 items-start">
                             <AlertTriangle className="text-rose-500 shrink-0 w-6 h-6 mt-0.5" />
                             <div>
                               <h4 className="font-bold text-rose-400 text-lg">{t('interactionWarning')}</h4>
                               <p className="text-sm text-rose-200/80 mt-1.5 leading-relaxed">{med.interaction_note}</p>
                             </div>
                          </div>
                        )}
                      </div>

                      <div className="md:text-right space-y-4 bg-dark-900/60 p-6 rounded-2xl border border-white/5 shrink-0 min-w-[240px]">
                        <div>
                          <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold mb-1">Frequency</p>
                          <p className="text-white font-semibold text-lg">{med.frequency}</p>
                        </div>
                        <div>
                          <p className="text-[0.65rem] text-slate-500 uppercase tracking-widest font-bold mb-1">Duration</p>
                          <p className="text-white font-semibold text-lg">{med.duration}</p>
                        </div>
                         <div className="pt-2 border-t border-white/5">
                          <p className="text-[0.65rem] text-rose-500/80 uppercase tracking-widest font-bold mb-1">Alerts</p>
                          <p className="text-rose-300 font-semibold text-sm">{med.warnings}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
             </div>

             <div className="glass-panel p-6 sm:p-8 rounded-[2rem] flex flex-col sm:flex-row items-center justify-between gap-6 overflow-hidden relative">
               <div className="absolute right-0 top-0 w-64 h-64 bg-brand-500/10 rounded-full blur-[80px]"></div>
               <div className="relative z-10 text-center sm:text-left">
                  <h4 className="text-2xl font-bold mb-1 text-white">{t('needMeds')}</h4>
                  <p className="text-slate-400 font-medium">Verify your location to find the nearest open pharmacy.</p>
               </div>
               <motion.button 
                 whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                 onClick={handleMapOpen} 
                 disabled={isLocating}
                 className="relative z-10 w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white text-dark-900 font-bold rounded-2xl hover:bg-brand-50 transition-colors shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
               >
                  <MapPin className="w-5 h-5" />
                  {isLocating ? 'Locating...' : t('viewMap')}
               </motion.button>
             </div>
          </motion.div>
        )}

        {showMap && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 bg-dark-900/80 backdrop-blur-md">
             <motion.div 
               initial={{ opacity: 0, scale: 0.95, y: 20 }}
               animate={{ opacity: 1, scale: 1, y: 0 }}
               className="bg-dark-900 border border-slate-700 w-full max-w-5xl h-[85vh] rounded-[2rem] overflow-hidden relative shadow-2xl flex flex-col ring-1 ring-white/10"
             >
                <div className="flex justify-between items-center p-6 bg-dark-800/80 border-b border-white/5">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       <MapPin className="w-5 h-5 text-brand-400" />
                       Nearby Pharmacies
                    </h3>
                  </div>
                  <button onClick={() => setShowMap(false)} className="p-2 bg-dark-900 rounded-full hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 w-full bg-slate-900">
                  <MapContainer center={userLocation || [19.0760, 72.8777]} zoom={13} style={{ height: '100%', minHeight: '60vh', width: '100%' }}>
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    {userLocation && (
                      <Marker position={userLocation}>
                        <Popup><b>You are here</b></Popup>
                      </Marker>
                    )}
                    <Marker position={userLocation ? [userLocation[0] + 0.005, userLocation[1] + 0.005] : [19.0760, 72.8777]}>
                      <Popup><b>Apollo Pharmacy</b> <br /> 0.8 km away. Open 24/7.</Popup>
                    </Marker>
                    <Marker position={userLocation ? [userLocation[0] - 0.008, userLocation[1] + 0.01] : [19.0810, 72.8800]}>
                      <Popup><b>Wellness Forever</b> <br /> 1.2 km away.</Popup>
                    </Marker>
                  </MapContainer>
                </div>
             </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

function App() {
  const [lang, setLang] = useState('en');

  const t = (key) => {
    return translations[lang] ? (translations[lang][key] || translations['en'][key] || key) : key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      <CustomCursor />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/app" element={<ScanApp />} />
        </Routes>
      </Router>
    </LanguageContext.Provider>
  );
}

export default App;
