import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, CheckCircle2, Circle, Star, Zap, Droplets, Wallet, Footprints, 
  Clock, Sparkles, Book, Heart, Coffee, Award, Trash2, Plus, X, ListTodo, Info, HelpCircle, Check, Compass
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

const DEFAULT_CHALLENGES = [
  { id: '1', title: "Minum Air 2L", category: "Health", icon: "Droplets", stars: 1 },
  { id: '2', title: "No Jajan Hari Ini", category: "Finance", icon: "Wallet", stars: 2 },
  { id: '3', title: "Jalan 5000 Langkah", category: "Fitness", icon: "Footprints", stars: 2 }
];

const ICON_OPTIONS = [
  { name: "Droplets", label: "Minuman/Sehat", icon: Droplets },
  { name: "Wallet", label: "Dompet/Uang", icon: Wallet },
  { name: "Footprints", label: "Langkah/Fisik", icon: Footprints },
  { name: "Clock", label: "Waktu/Disiplin", icon: Clock },
  { name: "Zap", label: "Energi/Semangat", icon: Zap },
  { name: "Book", label: "Pendidikan/Baca", icon: Book },
  { name: "Heart", label: "Kesehatan/Hati", icon: Heart },
  { name: "Coffee", label: "Mindful/Relaks", icon: Coffee },
  { name: "Award", label: "Lencana/Juara", icon: Award },
  { name: "Sparkles", label: "Kreativitas", icon: Sparkles }
];

const CATEGORY_OPTIONS = [
  { name: "Health", label: "Kesehatan", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  { name: "Finance", label: "Keuangan", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  { name: "Fitness", label: "Olahraga", color: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20" },
  { name: "Learning", label: "Pembelajaran", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20" },
  { name: "Mind", label: "Pikiran/Mental", color: "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20" },
  { name: "General", label: "Umum", color: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20" }
];

const getIconComponent = (key: string) => {
  const ICON_MAP: any = {
    Droplets,
    Wallet,
    Footprints,
    Clock,
    Zap,
    Sparkles,
    Book,
    Heart,
    Coffee,
    Award
  };
  return ICON_MAP[key] || Zap;
};

export default function Challenge() {
  const [challenges, setChallenges] = useState<any[]>([]);
  const [completed, setCompleted] = useState<string[]>([]);
  
  // Custom challenge form states
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Health");
  const [newIcon, setNewIcon] = useState("Droplets");
  const [newStars, setNewStars] = useState(2);
  const [isLoading, setIsLoading] = useState(false);

  // In-app dialog confirmation states
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [justEarnedBadge, setJustEarnedBadge] = useState<string | null>(null);

  const fetchChallenges = () => {
    fetch('/api/challenges')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setChallenges(data);
        } else {
          setChallenges(DEFAULT_CHALLENGES);
        }
      })
      .catch(() => {
        setChallenges(DEFAULT_CHALLENGES);
      });
  };

  useEffect(() => {
    fetchChallenges();
    const saved = localStorage.getItem('completed_challenges');
    if (saved) setCompleted(JSON.parse(saved));
  }, []);

  const toggleChallenge = (id: string) => {
    const isDone = completed.includes(id);
    let newCompleted;
    if (isDone) {
      newCompleted = completed.filter(c => c !== id);
    } else {
      newCompleted = [...completed, id];
      // Celebrate!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899']
      });
    }
    setCompleted(newCompleted);
    localStorage.setItem('completed_challenges', JSON.stringify(newCompleted));
  };

  const handleAddChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsLoading(true);

    try {
      const response = await fetch('/api/challenges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          category: newCategory,
          icon: newIcon,
          stars: newStars
        })
      });

      if (response.ok) {
        const added = await response.json();
        setChallenges(prev => [...prev, added]);
        setNewTitle("");
        setIsAdding(false);
        // Play dual side fireworks
        confetti({
          particleCount: 40,
          angle: 60,
          spread: 60,
          origin: { x: 0, y: 0.8 }
        });
        confetti({
          particleCount: 40,
          angle: 120,
          spread: 60,
          origin: { x: 1, y: 0.8 }
        });
      }
    } catch (err) {
      console.error("Gagal menambah tantangan kustom: ", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteChallenge = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid toggling open
    try {
      const response = await fetch(`/api/challenges/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setChallenges(prev => prev.filter(c => c.id !== id));
        if (completed.includes(id)) {
          const newCompleted = completed.filter(c => c !== id);
          setCompleted(newCompleted);
          localStorage.setItem('completed_challenges', JSON.stringify(newCompleted));
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetProgress = () => {
    setCompleted([]);
    localStorage.setItem('completed_challenges', JSON.stringify([]));
    setShowResetConfirm(false);
    confetti({
      particleCount: 50,
      spread: 40,
      colors: ['#3b82f6', '#10b981']
    });
  };

  // Star analytics and metrics
  const starsEarned = challenges
    .filter(c => completed.includes(c.id))
    .reduce((sum, c) => sum + (c.stars || 1), 0);

  const maxStarsPossible = challenges.reduce((sum, c) => sum + (c.stars || 1), 0);
  const completionProgress = challenges.length > 0 ? (completed.length / challenges.length) * 100 : 0;

  // Level classification based on stars
  let levelTitle = "Pemula Disiplin";
  let levelScore = 1;
  let levelColor = "from-blue-500 to-indigo-500";
  let levelNextBound = 5;

  if (starsEarned >= 15) {
    levelTitle = "Jiwa Tanpa Batas";
    levelScore = 4;
    levelColor = "from-rose-500 via-purple-600 to-amber-500 animate-gradient-bg";
    levelNextBound = 999;
  } else if (starsEarned >= 10) {
    levelTitle = "Master Kebiasaan";
    levelScore = 3;
    levelColor = "from-purple-500 to-pink-500";
    levelNextBound = 15;
  } else if (starsEarned >= 5) {
    levelTitle = "Ksatria Rutinitas";
    levelScore = 2;
    levelColor = "from-amber-500 to-orange-500";
    levelNextBound = 10;
  }

  // Milestones (Stamp / Badges Collection)
  const badgeMilestones = [
    {
      id: 'first_step',
      title: 'Langkah Awal',
      description: 'Selesaikan 1 misi harian apa saja',
      icon: Trophy,
      color: 'from-blue-500 to-cyan-500',
      isUnlocked: completed.length >= 1,
      hint: "Selesaikan 1 tantangan"
    },
    {
      id: 'water_hero',
      title: 'Pilar Hidrasi',
      description: 'Selesaikan tantangan bertema Kesehatan (Health)',
      icon: Droplets,
      color: 'from-cyan-500 to-sky-500',
      isUnlocked: challenges.some(c => c.category === 'Health' && completed.includes(c.id)),
      hint: "Misi Kesehatan selesai"
    },
    {
      id: 'frugal_guru',
      title: 'Frugal Guru',
      description: 'Selesaikan tantangan bertema Keuangan (Finance)',
      icon: Wallet,
      color: 'from-emerald-500 to-teal-500',
      isUnlocked: challenges.some(c => c.category === 'Finance' && completed.includes(c.id)),
      hint: "Misi Keuangan selesai"
    },
    {
      id: 'fitness_beast',
      title: 'Atlit Tangguh',
      description: 'Selesaikan tantangan bertema Olahraga (Fitness)',
      icon: Footprints,
      color: 'from-orange-500 to-red-500',
      isUnlocked: challenges.some(c => c.category === 'Fitness' && completed.includes(c.id)),
      hint: "Misi Olahraga selesai"
    },
    {
      id: 'scholar_mind',
      title: 'Pikir Cerdas',
      description: 'Selesaikan tantangan bertema Edukasi / Pikiran (Learning/Mind)',
      icon: Book,
      color: 'from-purple-500 to-violet-500',
      isUnlocked: challenges.some(c => (c.category === 'Learning' || c.category === 'Mind') && completed.includes(c.id)),
      hint: "Misi Belajar/Mental selesai"
    },
    {
      id: 'star_collector',
      title: 'Bintang Terang',
      description: 'Kumpulkan minimal 5 bintang dari seluruh misi',
      icon: Star,
      color: 'from-amber-400 to-yellow-500',
      isUnlocked: starsEarned >= 5,
      hint: "Kumpulkan 5 Bintang"
    },
    {
      id: 'perfect_day',
      title: 'Disiplin Sempurna',
      description: 'Selesaikan semua tantangan aktif',
      icon: Award,
      color: 'from-fuchsia-500 to-pink-500',
      isUnlocked: challenges.length > 0 && completed.length === challenges.length,
      hint: "Selesaikan semua misi"
    }
  ];

  // Confetti trigger when a new badge completes (stored in localstorage to alert user once)
  useEffect(() => {
    const unlockedList = badgeMilestones.filter(b => b.isUnlocked).map(b => b.id);
    const previouslyNotified = JSON.parse(localStorage.getItem('notified_badges') || '[]');
    
    // Find newly unlocked badges
    const newlyUnlocked = unlockedList.filter(id => !previouslyNotified.includes(id));
    if (newlyUnlocked.length > 0) {
      const badgeId = newlyUnlocked[0];
      const foundBadge = badgeMilestones.find(b => b.id === badgeId);
      if (foundBadge) {
        setJustEarnedBadge(foundBadge.title);
        // Fire huge confetti
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.5 },
          scalar: 1.2
        });
      }
      localStorage.setItem('notified_badges', JSON.stringify(unlockedList));
    } else {
      // Keep state sync
      localStorage.setItem('notified_badges', JSON.stringify(unlockedList));
    }
  }, [completed, challenges]);

  return (
    <div className="max-w-4xl mx-auto space-y-12 pb-24 text-left">
      {/* Title Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 rounded-full text-xs font-bold uppercase tracking-widest border border-amber-500/20">
          <Trophy className="w-4 h-4 text-amber-500 animate-bounce" />
          <span>Sistem Misi & Stamp Kustom</span>
        </div>
        <h1 className="text-4xl lg:text-5xl font-heading font-black text-slate-800 dark:text-white tracking-tight">
          Sistem Kebiasaan Harian
        </h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Tantang dirimu secara konsisten, buat tantangan kustom, peroleh bintang harian, dan kumpulkan stempel kehormatan!
        </p>
      </div>

      {/* Floating Earned Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-100 opacity-90 block">
              Bintang Diperoleh
            </span>
            <span className="text-3xl font-black font-mono">
              {starsEarned} <span className="text-lg font-normal">/ {maxStarsPossible} ⭐</span>
            </span>
          </div>
          <Star className="w-10 h-10 text-white/20 fill-white/10 absolute right-4 bottom-4 shrink-0" />
        </div>

        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-100 opacity-90 block">
              Level Karakter
            </span>
            <span className="text-lg font-extrabold pr-2 underline decoration-indigo-200">
              Lvl {levelScore}: {levelTitle}
            </span>
          </div>
          <Award className="w-10 h-10 text-white/20 absolute right-4 bottom-4 shrink-0" />
        </div>

        <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-100 opacity-90 block">
              Tantangan Selesai
            </span>
            <span className="text-3xl font-black font-mono">
              {completed.length} <span className="text-lg font-normal">/ {challenges.length} Misi</span>
            </span>
          </div>
          <CheckCircle2 className="w-10 h-10 text-white/20 absolute right-4 bottom-4 shrink-0" />
        </div>
      </div>

      {/* Progress Card & Controls */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 md:p-8 glass rounded-[36px] border border-slate-200 dark:border-white/5 shadow-xl flex flex-col md:flex-row items-center gap-8 text-left"
      >
        <div className="relative w-36 h-36 flex items-center justify-center shrink-0">
          <svg className="w-full h-full -rotate-90">
            <circle cx="72" cy="72" r="64" className="stroke-slate-100 dark:stroke-slate-800" strokeWidth="10" fill="none" />
            <motion.circle 
              cx="72" cy="72" r="64" 
              className="stroke-amber-500" 
              strokeWidth="10" 
              strokeDasharray="402"
              initial={{ strokeDashoffset: 402 }}
              animate={{ strokeDashoffset: 402 - (402 * completionProgress) / 100 }}
              transition={{ duration: 1, type: 'spring' }}
              fill="none" 
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-black font-heading text-slate-800 dark:text-white">{Math.round(completionProgress)}%</span>
            <span className="text-[9px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">SELESAI</span>
          </div>
        </div>

        <div className="flex-1 space-y-4 text-center md:text-left">
          <div className="space-y-1">
            <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white">Progres Kebiasaan</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {completed.length === challenges.length 
                ? "Luar biasa! Semua keningratan tantangan hari ini tercapai. Buka stamp barumu!" 
                : `Menyelesaikan ${completed.length} tantangan memberikan total bintang tambahan. Sedikit lagi menuju Stamp Elite!`}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Progres Level Karakter ({starsEarned} / {levelNextBound} Bintang)</span>
              <span className="font-bold text-amber-500">
                {levelNextBound === 999 ? "MAX LEVEL" : `${levelNextBound - starsEarned} ⭐ Menuju Level Berikutnya`}
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-150 dark:bg-slate-800 rounded-full overflow-hidden">
              <div 
                className={cn("h-full rounded-full transition-all duration-500 bg-gradient-to-r", levelColor)}
                style={{ width: `${levelNextBound === 999 ? 100 : Math.min((starsEarned / levelNextBound) * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Quick buttons */}
          <div className="flex flex-wrap gap-3 pt-1 justify-center md:justify-start">
            <button
              onClick={() => setIsAdding(!isAdding)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md cursor-pointer select-none"
            >
              {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isAdding ? "Batal Tambah" : "Tambah Tantangan Kustom"}</span>
            </button>

            <button
              onClick={() => setShowResetConfirm(!showResetConfirm)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border border-slate-200/50 dark:border-white/5 cursor-pointer select-none"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Hari Baru (Reset Progress)</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Confirmation reset dropdown/modal */}
      <AnimatePresence>
        {showResetConfirm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-6 bg-rose-500/10 border border-rose-500/20 text-rose-800 dark:text-rose-400 rounded-3xl space-y-4">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-rose-500 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-extrabold text-sm">Apakah Anda ingin mereset progress harian?</h4>
                  <p className="text-xs text-rose-700/80 dark:text-rose-400/80 mt-1 leading-relaxed">
                    Tindakan ini akan mengosongkan status "Selesai" untuk semua misi harian. Bintang dan lencana/stamp yang telah Anda klaim akan otomatis disesuaikan dengan status baru ini. Ini ideal dilakukan sewaktu memulai pagi hari baru.
                  </p>
                </div>
              </div>
              <div className="flex gap-2.5 justify-end">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-50 transition-all select-none"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleResetProgress}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all select-none"
                >
                  Ya, Mulai Hari Baru
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Brand Badge Congratulation modal */}
      <AnimatePresence>
        {justEarnedBadge && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 border border-amber-500/30 p-8 rounded-[40px] max-w-sm text-center space-y-6 shadow-2xl relative"
            >
              <div className="absolute top-4 right-4">
                <button 
                  onClick={() => setJustEarnedBadge(null)}
                  className="p-1 px-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-rose-500 hover:text-white transition-all cursor-pointer text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-amber-500 to-yellow-400 rounded-full flex items-center justify-center text-white scale-110 shadow-lg relative glow">
                <Trophy className="w-10 h-10 animate-bounce" />
                <Sparkles className="w-5 h-5 absolute -top-1 -right-1 text-yellow-300 fill-yellow-300" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-heading font-black text-slate-800 dark:text-white">Lencana Terbuka!</h3>
                <p className="text-2xl font-bold text-amber-500">{justEarnedBadge}</p>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Selamat! Anda telah mendapatkan stempel baru atas konsistensi dan determinasi Anda hari ini. Teruslah pertahankan!
                </p>
              </div>

              <button
                onClick={() => setJustEarnedBadge(null)}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:scale-[1.02] text-white rounded-2xl text-xs font-bold shadow-md transition-all cursor-pointer select-none"
              >
                Keren, Terima Kasih!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Tambah Tantangan Kustom */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -20, height: 0 }}
            className="overflow-hidden"
          >
            <form onSubmit={handleAddChallenge} className="p-6 md:p-8 bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-white/5 rounded-[36px] shadow-lg space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-white/5 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-xl">
                    <ListTodo className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-100 text-base">Buat Tantangan Kustom</h4>
                    <p className="text-[10px] text-slate-400">Rancang kegiatan harian pembangun kebiasaan barumu</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                    Nama Tantangan
                  </label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Contoh: Membaca Buku Finansial 15 Halaman"
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl text-xs outline-none dark:text-white border border-slate-200 dark:border-white/10 focus:border-indigo-500 font-sans shadow-inner"
                  />
                </div>

                {/* Grid Category & Star Amount */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                      Kategori Kegiatan
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORY_OPTIONS.map((cat) => (
                        <button
                          key={cat.name}
                          type="button"
                          onClick={() => setNewCategory(cat.name)}
                          className={cn(
                            "py-2 px-2.5 rounded-xl border text-[10px] font-bold text-center capitalize transition-all cursor-pointer",
                            newCategory === cat.name
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                          )}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                      Reward Bintang harian
                    </label>
                    <div className="flex gap-3">
                      {[1, 2, 3].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setNewStars(val)}
                          className={cn(
                            "flex-1 py-3 px-4 rounded-xl border flex items-center justify-center gap-1.5 transition-all text-xs font-black cursor-pointer",
                            newStars === val
                              ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900"
                          )}
                        >
                          <span>{val}</span>
                          <Star className={cn("w-3.5 h-3.5", newStars === val ? "fill-white text-white" : "text-amber-500 fill-amber-500/20")} />
                        </button>
                      ))}
                    </div>
                    <span className="text-[9px] text-slate-400 pl-1 block mt-1 italic">
                      *Makin menantang misinya, naikkan reward bintangnya!
                    </span>
                  </div>
                </div>

                {/* Icon Selection */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block pl-1">
                    Pilih Representasi Visual (Ikon)
                  </label>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {ICON_OPTIONS.map((opt) => {
                      const IconComponent = opt.icon;
                      const isSelected = newIcon === opt.name;
                      return (
                        <button
                          key={opt.name}
                          type="button"
                          onClick={() => setNewIcon(opt.name)}
                          title={opt.label}
                          className={cn(
                            "p-3 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer",
                            isSelected
                              ? "bg-indigo-600 border-indigo-600 text-white shadow-md scale-105"
                              : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                          )}
                        >
                          <IconComponent className="w-5 h-5 shrink-0" />
                          <span className="text-[8px] font-medium tracking-tight mt-1 hidden md:block truncate max-w-full">
                            {opt.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-5 py-3 border border-slate-200 dark:border-white/10 text-slate-500 rounded-xl text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer transition-all select-none"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all disabled:opacity-50 select-none flex items-center gap-1.5"
                >
                  {isLoading ? "Menyimpan Misi..." : "Konfirmasi Buat Misi"}
                  <Check className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Tantangan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pl-1">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-amber-500" />
            <h2 className="text-xl font-heading font-black text-slate-800 dark:text-white">Daftar Tantangan Aktif</h2>
          </div>
          <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase font-mono">
            {challenges.length} Tantangan Terdaftar
          </span>
        </div>

        <div className="grid gap-4">
          {challenges.map((challenge, i) => {
            const isDone = completed.includes(challenge.id);
            const Icon = getIconComponent(challenge.icon);
            const categoryData = CATEGORY_OPTIONS.find(c => c.name === challenge.category) || {
              label: challenge.category,
              color: "bg-slate-100 dark:bg-slate-900/30 text-slate-500 border-slate-200"
            };

            return (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => toggleChallenge(challenge.id)}
                className={cn(
                  "group w-full p-5 md:p-6 rounded-3xl border transition-all flex items-center gap-4 cursor-pointer select-none relative",
                  isDone 
                    ? "bg-emerald-500/5 dark:bg-emerald-900/10 border-emerald-500/20 hover:border-emerald-500/40 opacity-90" 
                    : "glass border-slate-200 dark:border-white/5 hover:border-indigo-500/30 shadow-sm"
                )}
              >
                {/* Complete Stamp Circle Indicator on the item */}
                {isDone && (
                  <div className="absolute right-20 top-1/2 -translate-y-1/2 rotate-12 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-2 border-dashed border-emerald-500/40 text-[10px] font-black rounded-lg px-2.5 py-1 tracking-widest select-none pointer-events-none hidden sm:block uppercase">
                    SELESAI (STAMPED)
                  </div>
                )}

                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shrink-0",
                  isDone 
                    ? "bg-emerald-500 text-white shadow-inner" 
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-600 dark:group-hover:text-indigo-400"
                )}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0 text-left">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className={cn("font-bold text-base md:text-lg truncate block max-w-full", isDone ? "text-slate-400 dark:text-slate-500 line-through" : "text-slate-800 dark:text-white")}>
                      {challenge.title}
                    </h4>
                    {challenge.isCustom && (
                      <span className="text-[8px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                        KUSTOM
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className={cn("text-[8px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider", categoryData.color)}>
                      {categoryData.label}
                    </span>
                    
                    {/* Stars Indicator */}
                    <div className="flex gap-0.5 items-center">
                      {[...Array(challenge.stars || 1)].map((_, starIdx) => (
                        <Star key={starIdx} className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />
                      ))}
                      <span className="text-[10px] font-bold text-amber-600/90 pl-1">
                        +{challenge.stars || 1} Star Reward
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Delete button if custom challenge */}
                  {challenge.isCustom && (
                    <button
                      type="button"
                      onClick={(e) => handleDeleteChallenge(challenge.id, e)}
                      title="Hapus Tantangan Kustom"
                      className="p-2 bg-slate-50 hover:bg-rose-500 hover:text-white dark:bg-slate-800/40 text-slate-400 rounded-xl cursor-pointer transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all",
                    isDone 
                      ? "bg-emerald-500 border-emerald-500 text-white shadow-md scale-105" 
                      : "border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900"
                  )}>
                    {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 opacity-0 group-hover:opacity-100 text-indigo-500" />}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Reward Cabinet (Koleksi Stempel & Badges) */}
      <div className="space-y-5 pt-4">
        <div className="p-1 text-left space-y-1">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500 animate-pulse" />
            <h2 className="text-xl font-heading font-black text-slate-800 dark:text-white">Koleksi Stempel Penting</h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
            Lencana ini otomatis terbaca dan tersetel sebagai medali permanen (stamp) setelah Anda merampungkan target yang dikoordinasikan.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {badgeMilestones.map((badge) => {
            const BadgeIcon = badge.icon;
            return (
              <div 
                key={badge.id}
                className={cn(
                  "p-5 rounded-3xl border flex flex-col items-center justify-between text-center relative overflow-hidden transition-all duration-300 shadow-sm",
                  badge.isUnlocked
                    ? "bg-gradient-to-br from-white dark:from-slate-900 to-slate-50 dark:to-slate-950 border-amber-500/40 dark:border-amber-500/20 scale-[1.02] shadow-amber-500/5"
                    : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/5 opacity-60 grayscale"
                )}
              >
                {/* Stamp overlay or watermark for verified unlocked badge */}
                {badge.isUnlocked ? (
                  <div className="absolute top-2 right-2 bg-amber-500 text-white p-0.5 rounded-full shadow shrink-0">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                ) : (
                  <div className="absolute top-2 right-2 text-slate-400 p-0.5">
                    <X className="w-3 h-3 stroke-[2] opacity-40" />
                  </div>
                )}

                <div className="flex flex-col items-center space-y-3.5 py-2">
                  {/* Decorative glowing backplate */}
                  <div className={cn(
                    "w-14 h-14 rounded-2xl flex items-center justify-center transition-all shadow-md relative",
                    badge.isUnlocked
                      ? `bg-gradient-to-br ${badge.color} text-white`
                      : "bg-slate-100 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600"
                  )}>
                    <BadgeIcon className="w-7 h-7" />
                  </div>

                  <div className="space-y-1">
                    <h5 className={cn("font-extrabold text-[13px] tracking-tight pb-0.5 leading-snug", badge.isUnlocked ? "text-slate-800 dark:text-white font-sans" : "text-slate-400")}>
                      {badge.title}
                    </h5>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-normal px-1">
                      {badge.description}
                    </p>
                  </div>
                </div>

                <div className="w-full mt-3 pt-3 border-t border-slate-100 dark:border-white/5">
                  {badge.isUnlocked ? (
                    <span className="text-[8px] font-black tracking-widest text-[#d97706] dark:text-[#f59e0b] uppercase font-mono block">
                      ✓ UNLOCKED (CLAIMED)
                    </span>
                  ) : (
                    <span className="text-[8px] font-extrabold tracking-widest text-slate-400 dark:text-slate-500 uppercase font-mono block">
                      HINT: {badge.hint}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Decorative motivational banner */}
      <div className="p-8 bg-slate-900 dark:bg-slate-950 text-white rounded-[36px] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative shadow-lg">
        <div className="space-y-2 relative z-10 text-center md:text-left">
          <h4 className="text-xl font-heading font-black tracking-tight text-white">Disiplin Mewujudkan Kebebasan Finansial</h4>
          <p className="text-xs text-slate-400 font-sans max-w-lg leading-relaxed">
            Membangun kebiasaan harian yang berkelanjutan menjaga fokus pikiran, kestabilan finansial, dan kesehatan raga Anda agar optimal sepanjang hari.
          </p>
        </div>
        <Sparkles className="w-24 h-24 text-white/5 absolute -right-4 -bottom-4 rotate-12 pointer-events-none" />
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
