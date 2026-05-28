import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Sun, X, Sparkles, Send,
  Cloud, CloudRain, CloudLightning, Snowflake, CloudFog
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from './lib/utils';
import ReactMarkdown from 'react-markdown';

// Initialize Gemini AI (Moved to backend for security)
// Pages
import LandingPage from './pages/LandingPage';
import FinancialTracker from './pages/FinancialTracker';
import Shop from './pages/Shop';
import MiniGames from './pages/MiniGames';
import Challenge from './pages/Challenge';
import MusicPlayer from './pages/MusicPlayer';
import ARGuide from './pages/ARGuide';
import Pomodoro from './pages/Pomodoro';
import AdminDashboard from './pages/AdminDashboard';
import Feedback from './pages/Feedback';

// Components
import SharedLayout from './components/SharedLayout';
import { AuthProvider } from './lib/auth';
import { MusicProvider } from './lib/music';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <MusicProvider>
          <SharedLayout>
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<FinancialTracker />} />
                <Route path="/about" element={<LandingPage />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/games" element={<MiniGames />} />
                <Route path="/challenge" element={<Challenge />} />
                <Route path="/music" element={<MusicPlayer />} />
                <Route path="/ar" element={<ARGuide />} />
                <Route path="/pomodoro" element={<Pomodoro />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/feedback" element={<Feedback />} />
              </Routes>
            </AnimatePresence>
          </SharedLayout>
          {!(typeof window !== 'undefined' && window.location.search.includes('view=3b8c2d96')) && (
            <>
              <WeatherWidget />
              <AIChatBubble />
            </>
          )}
        </MusicProvider>
      </AuthProvider>
    </Router>
  );
}

function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);

  useEffect(() => {
    fetch('/api/weather')
      .then(res => res.json())
      .then(setWeather)
      .catch(() => {});
  }, []);

  if (!weather) return null;

  const WeatherIcon = () => {
    switch (weather.icon) {
      case 'Cloud': return <Cloud className="w-5 h-5 text-primary animate-pulse" />;
      case 'CloudRain': return <CloudRain className="w-5 h-5 text-primary animate-pulse" />;
      case 'CloudLightning': return <CloudLightning className="w-5 h-5 text-primary animate-pulse" />;
      case 'Snowflake': return <Snowflake className="w-5 h-5 text-primary animate-pulse" />;
      case 'CloudFog': return <CloudFog className="w-5 h-5 text-primary animate-pulse" />;
      default: return <Sun className="w-5 h-5 text-primary animate-pulse" />;
    }
  };

  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className="fixed top-20 right-4 md:top-auto md:bottom-24 md:right-8 z-40 flex items-center gap-2 md:gap-3 p-2 md:p-3 glass rounded-xl md:rounded-2xl shadow-xl border border-white/20 dark:border-white/10 select-none transition-all scale-90 md:scale-100"
    >
      <div className="bg-primary/20 p-1.5 md:p-2 rounded-lg md:rounded-xl">
        <WeatherIcon />
      </div>
      <div className="pr-1">
        <p className="hidden md:block text-[10px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{weather.city}</p>
        <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white leading-none md:leading-normal">
          <span className="md:hidden text-[10px] text-primary/70">{weather.city} • </span>
          {weather.temp}°C <span className="hidden md:inline">• {weather.condition}</span>
        </p>
      </div>
    </motion.div>
  );
}

function AIChatBubble() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: "Halo! Saya FinBot, asisten AI kamu. Silakan tanya apa saja, saya ditenagai oleh Gemini AI!", isBot: true }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const suggestions = [
    "Tips hemat mahasiswa",
    "Jelaskan tentang FinTag",
    "Ide bisnis sampingan",
    "Cara nabung 1 juta sebulan"
  ];

  const handleSend = async (text: string = input) => {
    if (!text.trim() || isLoading) return;
    
    const userMessage = { text, isBot: false };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const now = new Date();
      const timeStr = now.toLocaleString('id-ID', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });

      const systemInstruction = `Kamu adalah FinBot, asisten AI cerdas untuk platform FinTag. FinTag menjual produk utama berupa **Gantungan Kunci NFC** yang memudahkan mahasiswa mencatat keuangan. Kamu ramah, profesional, dan pintar. 
      Waktu sekarang adalah: ${timeStr}.
      
      INFORMASI WEBSITE FINTAG:
      Website ini memiliki beberapa fitur dan halaman utama:
      1. **Home (/)**: Halaman utama yang menjelaskan apa itu FinTag dan produk Gantungan Kunci NFC-nya.
      2. **Tracker (/tracker)**: Alat pencatat keuangan otomatis yang terintegrasi dengan produk FinTag.
      3. **Shop (/shop)**: Toko resmi untuk memesan "Gantungan NFC FinTag" seharga Rp 15.000 (Custom foto +Rp 2.000).
      4. **Games (/games)**: Area hiburan dengan 5 mini games: "Hemat atau Boros" (Quiz Finansial), "Coin Catch" (Tangkap koin), "Memory Match" (Asah otak), "Quick Tap" (Ketangkasan), dan "Color Reflex" (Refleks).
      5. **Challenge (/challenge)**: Program tantangan harian. Saat ini ada 3 tantangan: "Minum Air 2L" (Health), "No Jajan Hari Ini" (Finance), dan "Jalan 5000 Langkah" (Fitness).
      6. **Music (/music)**: Fitur Music Player. Playlist lagu yang dinamis dan dikelola melalui Admin Dashboard secara langsung.
      7. **Panduan (/ar)**: Panduan interaktif mendaftarkan gantungan kunci NFC FinTag dan menggunakan Augmented Reality.
      8. **Timer (/pomodoro)**: Alat bantu produktivitas menggunakan teknik Pomodoro. (Fokus & Istirahat).

      PENTING: Jangan berikan jawaban "ngasal" atau improvisasi tentang data website jika tidak ada di informasi di atas. Jika data yang diminta user tidak ada, sampaikan dengan jujur dan ramah.

      Kamu bisa menjawab apa saja, baik tentang manajemen keuangan, teknologi NFC, maupun topik umum lainnya seperti AI dan Gemini. 
      Jawablah dengan bahasa Indonesia yang santai tapi sopan. Fokus pada memberikan solusi bermanfaat bagi mahasiswa.
      
      ATURAN FORMAT JAWABAN (SANGAT PENTING):
      - Gunakan Markdown yang rapi dan terstruktur.
      - Gunakan **Bold** untuk poin penting.
      - Gunakan Bullet Points (-) untuk daftar informasi.
      - Gunakan Line Breaks (\n\n) antar paragraf agar tidak padat.
      - Jangan memberikan paragraf yang terlalu panjang.
      - Jika memberikan tips, bagi menjadi poin-poin yang jelas (1, 2, 3).
      - Jika ditanya tentang data hari ini atau waktu, gunakan informasi waktu yang diberikan.`;

      // Prepare conversation history
      const history = (messages || [])
        .map(msg => ({
          role: msg.isBot ? 'model' : 'user',
          parts: [{ text: msg.text }]
        }));

      // Ensure alternating roles and starts with User
      const filteredHistory: any[] = [];
      let lastRole = '';
      for (const msg of history) {
        if (filteredHistory.length === 0 && msg.role !== 'user') continue;
        if (msg.role !== lastRole) {
          filteredHistory.push(msg);
          lastRole = msg.role;
        }
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: filteredHistory,
          text: text,
          systemInstruction
        })
      });

      let result;
      try {
        const contentType = response.headers.get("content-type");
        const responseText = await response.text();
        
        if (!response.ok) {
          if (contentType && contentType.includes("application/json")) {
            result = JSON.parse(responseText);
            throw new Error(result.details || result.error || 'Server error');
          } else {
            // This is likely a Vercel/Server 404 or 500 HTML page
            if (response.status === 404) {
              throw new Error("API tidak ditemukan (404). Jika di Vercel, pastikan kamu sudah melakukan konfigurasi Backend.");
            }
            throw new Error(`Server error (${response.status}): ${responseText.substring(0, 50)}...`);
          }
        }
        
        if (!responseText) {
          throw new Error("Server mengirim respons kosong.");
        }
        result = JSON.parse(responseText);
      } catch (e: any) {
        console.error('Fetch/Parse error:', e);
        throw e;
      }
      
      const botText = result.text || "Maaf, saya tidak bisa memberikan jawaban saat ini.";
      setMessages(prev => [...prev, { text: botText, isBot: true }]);
    } catch (error: any) {
      console.error('Chat error detail:', error);
      let errorMessage = `Gagal terhubung ke AI: ${error.message || 'Koneksi terputus'}`;
      
      if (error.message?.includes('configured') || error.message?.includes('diketahui')) {
        errorMessage = "API Key Gemini belum dikonfigurasi di server. Jika kamu menjalankan secara lokal, pastikan kamu sudah membuat file .env (BUKAN .env.example) dan mengisinya dengan API Key.";
      } else if (error.message?.includes('429') || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = "Maaf, kuota harian AI saya sedang habis (ini batas gratis dari Google). Coba lagi beberapa saat lagi ya!";
      } else if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        errorMessage = "API Key Gemini tidak valid. Silakan periksa kembali API Key kamu.";
      }
      
      setMessages(prev => [...prev, { text: errorMessage, isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-8 right-8 z-50 w-14 h-14 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-slate-800 transition-colors"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
        {!isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full border-2 border-white"
          />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-8 z-50 w-[350px] max-w-[calc(100vw-40px)] h-[550px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-none overflow-hidden flex flex-col transition-colors"
          >
            <div className="p-5 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-white/10 text-slate-900 dark:text-white flex items-center justify-between transition-colors shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-2xl flex items-center justify-center border border-primary/30 relative">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-950" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">FinBot AI</h3>
                  <p className="text-[10px] text-slate-500 dark:text-white/50 font-bold uppercase tracking-widest">Powered by Gemini</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:text-white/70 dark:hover:text-white">
                 <X className="w-4 h-4" />
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50 dark:bg-slate-900/50 transition-colors">
              {messages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i} 
                  className={cn("flex", msg.isBot ? "justify-start" : "justify-end")}
                >
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-2xl text-sm leading-normal",
                    msg.isBot 
                      ? "bg-white dark:bg-slate-700/50 text-slate-900 dark:text-white rounded-tl-none border border-slate-200 dark:border-white/10 shadow-md shadow-slate-200/50 dark:shadow-none backdrop-blur-sm" 
                      : "bg-primary text-white rounded-tr-none shadow-md shadow-primary/20"
                  )}>
                    {msg.isBot ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-li:my-0 text-slate-900 dark:text-slate-50">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="text-white">{msg.text}</span>
                    )}
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                   <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-white/5 p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-1">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                   </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-white/5 transition-colors shrink-0">
              <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar scroll-smooth">
                {suggestions.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => handleSend(s)}
                    disabled={isLoading}
                    className="whitespace-nowrap text-[10px] font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 py-2 px-4 rounded-xl hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 text-slate-900 dark:text-slate-300"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Tanya apa saja..."
                  disabled={isLoading}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl pl-5 pr-12 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 text-slate-900 dark:text-white placeholder:text-slate-500"
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-secondary dark:bg-primary text-white p-2.5 rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-lg shadow-secondary/10"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
