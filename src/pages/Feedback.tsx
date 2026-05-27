import { motion, AnimatePresence } from 'motion/react';
import { 
  Mail, MessageSquare, Send, Sparkles, CheckCircle, Trash2, 
  ArrowRight, Bug, Heart, AlertCircle, ExternalLink, HelpCircle, Star, Sparkle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

interface SavedMessage {
  id: string;
  name: string;
  category: string;
  rating: number;
  subject: string;
  message: string;
  timestamp: string;
  recipient: string;
}

const DEVELOPER_EMAIL = "mhdalfinaja@mhs.unimed.ac.id";

const PRESETS = [
  {
    category: "Appreciation",
    subject: "Kesan Pesan: Aplikasi Sangat Membantu!",
    message: "Halo Team Developer FinTag,\n\nSaya ingin mengucapkan terima kasih atas pembuatan web ini! Gantungan kunci NFC-nya keren sekali dan pencatatan keuangannya sangat rapi. Sangat membantu saya mengelola uang jajan kuliah sehari-hari.\n\nSemoga sukses selalu!"
  },
  {
    category: "Feedback",
    subject: "Saran: Tambah Lagu atau Game Baru",
    message: "Halo Team Developer FinTag,\n\nFiturnya sudah bagus. Saran saya, kalau bisa ditambahkan lagu baru (seperti: ...) atau ditambahkan mode mini game baru lagi agar website kita ini semakin seru untuk dimainkan mahasiswa.\n\nTerima kasih."
  },
  {
    category: "Bug",
    subject: "Bug: Masalah pada Chatbot",
    message: "Halo Team Developer FinTag,\n\nSaya mengalami sedikit kendala pada chatbot FinBot, di mana chatbot terasa lambat atau tidak merespons ketika saya mengirimkan pertanyaan. Mohon bantuannya untuk memeriksa dan memperbaiki agar asisten cerdas ini bisa kembali lancar digunakan.\n\nTerima kasih!"
  }
];

export default function Feedback() {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Appreciation" | "Feedback" | "Bug" | "Other">("Appreciation");
  const [rating, setRating] = useState(5);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [feedbacksList, setFeedbacksList] = useState<any[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [localSubmittedIds, setLocalSubmittedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchFeedbacks = () => {
    fetch('/api/feedbacks')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFeedbacksList(data);
        }
      })
      .catch(e => console.error(e));
  };

  useEffect(() => {
    fetchFeedbacks();
    // Load state of what was submitted by this browser
    const submitted = localStorage.getItem('submitted_feedback_ids');
    if (submitted) {
      try {
        setLocalSubmittedIds(JSON.parse(submitted));
      } catch (err) {}
    }
  }, []);

  const selectPreset = (preset: typeof PRESETS[0]) => {
    setCategory(preset.category as any);
    setSubject(preset.subject);
    setMessage(preset.message);
    confetti({
      particleCount: 20,
      spread: 30,
      origin: { y: 0.8 }
    });
  };

  const handleSendFeedback = async () => {
    if (!message.trim() || !subject.trim()) {
      setNotification("Silakan isi subjek pesan dan isi pesan terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setNotification(null);

    try {
      const response = await fetch('/api/feedbacks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: name || "Anonim",
          category,
          rating,
          subject,
          message
        })
      });

      if (!response.ok) {
        throw new Error('Gagal mengirimkan tanggapan');
      }

      const newFeedback = await response.json();

      // Store ID locally to badge as "Milik Anda"
      const updatedIds = [...localSubmittedIds, newFeedback.id];
      setLocalSubmittedIds(updatedIds);
      localStorage.setItem('submitted_feedback_ids', JSON.stringify(updatedIds));

      // Reset fields
      setSubject("");
      setMessage("");

      // Trigger Confetti explosion
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });

      setNotification("🎉 Sukses! Pesan kamu berhasil dikirim.");
      fetchFeedbacks(); // refresh real-time listing

      setTimeout(() => {
        setNotification(null);
      }, 7000);

    } catch (err: any) {
      setNotification(`⚠️ Terjadi kesalahan: ${err.message || 'Gagal tersambung ke server'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    // Users can't delete from database unless they are admin,
    // but they can clear their locally cached "Milik Anda" markings
    setLocalSubmittedIds([]);
    localStorage.removeItem('submitted_feedback_ids');
    confetti({
      particleCount: 15,
      spread: 20
    });
    setNotification("Berhasil membersihkan cache penanda pesan milik Anda.");
    setTimeout(() => setNotification(null), 3000);
  };

  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sentHistory.filter(item => item.id !== id);
    setSentHistory(filtered);
    localStorage.setItem('feedback_history', JSON.stringify(filtered));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 text-left">
      {/* Title Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-500/20">
          <Mail className="w-4 h-4 text-indigo-500 animate-pulse" />
          <span>Hubungi Developer FinTag</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-heading font-black text-slate-800 dark:text-white tracking-tight">
          Kirim Suara & Saran Kamu
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Punya kritik, kesan mendalam, saran perbaikan, atau menemukan bug menyebalkan? Laporkan langsung kepada kami!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/5 rounded-[36px] p-6 md:p-8 shadow-xl space-y-6">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>Formulir Pesan</span>
            </h3>

            {/* Quick Presets */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-450 dark:text-slate-500 uppercase tracking-widest block pl-1">
                Ketik Cepat Menggunakan Template
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => selectPreset(preset)}
                    className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 hover:border-indigo-500/40 text-left text-xs text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-900 transition-all cursor-pointer font-medium"
                  >
                    {preset.category === "Appreciation" ? "🌸 Kesan" : preset.category === "Feedback" ? "⚠️ Saran" : "🐛 Bug"}: {preset.subject.split(": ")[1]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Sender Name & Rating Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                    Nama Kamu (Opsional)
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Muhammad Alfin"
                    className="w-full bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl text-xs outline-none dark:text-white border border-slate-200 dark:border-white/10 focus:border-indigo-500 font-sans shadow-inner"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                    Rating Aplikasi Kami
                  </label>
                  <div className="flex gap-1.5 p-1 bg-slate-50 dark:bg-slate-950 border border-slate-200/50 dark:border-white/5 rounded-2xl items-center justify-center h-[50px]">
                    {[1, 2, 3, 4, 5].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setRating(val);
                          confetti({
                            particleCount: 10,
                            spread: 15,
                            origin: { y: 0.8 }
                          });
                        }}
                        className="p-1 hover:scale-125 transition-all text-amber-500 cursor-pointer"
                        title={`${val} Bintang`}
                      >
                        <Star className={cn("w-5 h-5", val <= rating ? "fill-amber-500 text-amber-500" : "text-slate-300 dark:text-slate-700")} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category Buttons */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                  Kategori Pesan
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["Appreciation", "Feedback", "Bug", "Other"] as const).map((cat) => {
                    const labelMap = {
                      Appreciation: "🌸 Kesan Pesan",
                      Feedback: "⚠️ Kritik/Saran",
                      Bug: "🐛 Lapor Bug",
                      Other: "💡 Lainnya"
                    };

                    const isSelected = category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={cn(
                          "py-2.5 px-2 rounded-xl text-center text-xs font-bold border transition-all cursor-pointer",
                          isSelected
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                            : "bg-slate-50 dark:bg-slate-950 border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                        )}
                      >
                        {labelMap[cat]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                  Subjek Email
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Contoh: Kesan Pesan pengoperasian FinTag NFC"
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 p-3.5 rounded-2xl text-xs outline-none dark:text-white border border-slate-200 dark:border-white/10 focus:border-indigo-500 font-sans shadow-inner"
                />
              </div>

              {/* Message Content */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                  Isi Pesan Detail
                </label>
                <textarea
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tuliskan keluhan atau kekaguman Anda dengan jelas di sini..."
                  required
                  className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-xs outline-none dark:text-white border border-slate-200 dark:border-white/10 focus:border-indigo-500 font-sans shadow-inner resize-none leading-relaxed"
                />
              </div>
            </div>

            {notification && (
              <div className="p-4 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-2xl text-xs font-medium leading-relaxed">
                {notification}
              </div>
            )}

            {/* Direct Database Send Option */}
            <div className="pt-2">
              <button
                type="button"
                disabled={isLoading}
                onClick={handleSendFeedback}
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md select-none disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>{isLoading ? "Sedang mengirim..." : "Kirim Masukan Langsung"}</span>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center leading-relaxed">
              *Masukan Anda langsung tersimpan di database internal dan dapat dimoderasi langsung oleh Administrator lewat Admin Dashboard.
            </p>
          </div>
        </div>

        {/* Right Side: Live Feedback Board & User Submitted Indicators */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section: Live Feed from Database */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200/85 dark:border-white/5 rounded-[36px] p-6 space-y-4">
            <div className="flex items-center justify-between pl-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1.5 font-heading">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Pesan Pengguna Terkirim ({feedbacksList.length})</span>
              </h4>
              {localSubmittedIds.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[9px] font-black text-rose-500 hover:underline uppercase tracking-wider cursor-pointer"
                >
                  Bersihkan Penanda
                </button>
              )}
            </div>

            {feedbacksList.length === 0 ? (
              <div className="text-center py-12 bg-slate-50/50 dark:bg-slate-950/20 border border-dashed border-slate-200/50 dark:border-white/5 rounded-2xl p-4">
                <MessageSquare className="w-8 h-8 text-slate-350 dark:text-slate-700 mx-auto mb-2 animate-bounce" />
                <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed font-sans">
                  Belum ada pesan terkirim di database. Jadilah pengirim pertama dan saksikan suaramu muncul seketika secara live!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
                {[...feedbacksList].reverse().map((item) => {
                  const isOwn = localSubmittedIds.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200/60 dark:border-white/5 rounded-2xl text-[11px] space-y-2 hover:border-slate-300 dark:hover:border-white/10 transition-all text-left relative",
                        isOwn && "ring-1 ring-indigo-500 bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider",
                            item.category === "Appreciation" 
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                              : item.category === "Bug" 
                                ? "bg-rose-500/10 text-rose-600 dark:text-rose-400" 
                                : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                          )}>
                            {item.category === "Appreciation" ? "🌸 Kesan" : item.category === "Bug" ? "🐛 Bug" : item.category === "Feedback" ? "⚠️ Saran" : "💡 Lainnya"}
                          </span>
                          {item.rating && (
                            <div className="flex">
                              {[...Array(Number(item.rating) || 5)].map((_, idx) => (
                                <Star key={idx} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              ))}
                            </div>
                          )}
                        </div>

                        {isOwn && (
                          <span className="text-[8px] font-black bg-indigo-600 text-white px-2 py-0.5 rounded uppercase tracking-wider">
                            Pesan Anda
                          </span>
                        )}
                      </div>
                      
                      <h5 className="font-extrabold text-slate-700 dark:text-slate-300 truncate pt-0.5 font-sans leading-normal">
                        {item.subject}
                      </h5>
                      
                      <p className="text-[10px] text-slate-550 dark:text-slate-400 leading-relaxed font-sans whitespace-pre-line bg-white/70 dark:bg-slate-900 border border-slate-100 dark:border-white/5 p-2.5 rounded-xl shadow-inner">
                        {item.message}
                      </p>

                      <div className="text-[8px] font-bold text-slate-400 font-mono flex items-center justify-between pt-1">
                        <span>PENGIRIM: <span className="text-slate-600 dark:text-slate-300 font-black">{item.name || "Anonim"}</span></span>
                        <span>WAKTU: {item.timestamp}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Profile Banner */}
      <div className="p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-[36px] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-lg">
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <div className="flex justify-center md:justify-start items-center gap-1.5">
            <Sparkle className="w-4 h-4 text-indigo-300 animate-spin" />
            <h4 className="text-xl font-heading font-black tracking-tight text-white">Technopreneurship Kelompok 3 Unimed</h4>
          </div>
          <p className="text-xs text-slate-400 font-sans max-w-lg leading-relaxed">
            Saran dan kritik Anda adalah bahan bakar inovasi kami untuk menyempurnakan FinTag NFC pencatat finansial. Terima kasih atas dukungan luar biasa Anda!
          </p>
        </div>
        <Mail className="w-24 h-24 text-white/5 absolute -right-3 -bottom-3 rotate-12 pointer-events-none" />
        <Link 
          to="/" 
          className="relative z-10 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold uppercase transition-all select-none shadow hover:scale-105 shrink-0 text-center"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
