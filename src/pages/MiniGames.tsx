import { motion, AnimatePresence } from 'motion/react';
import { Gamepad2, Trophy, RefreshCcw, Target, Zap, Clock, Brain, MousePointer2, Palette, ShoppingBag, Wallet, BarChart3, Users, Utensils, Heart } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { cn } from '../lib/utils';

type GameType = 'quiz' | 'coin' | 'memory' | 'tap' | 'color';

export default function MiniGames() {
  const [activeGame, setActiveGame] = useState<GameType | null>(null);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const games = [
    { id: 'quiz', name: 'Hemat atau Boros', icon: Brain, color: 'bg-indigo-500', desc: 'Uji pengetahuan finansialmu.' },
    { id: 'coin', name: 'Coin Catch', icon: Zap, color: 'bg-amber-500', desc: 'Tangkap koin yang jatuh!' },
    { id: 'memory', name: 'Memory Match', icon: Trophy, color: 'bg-emerald-500', desc: 'Latih ingatan keuanganmu.' },
    { id: 'tap', name: 'Quick Tap', icon: MousePointer2, color: 'bg-rose-500', desc: 'Tap secepat mungkin!' },
    { id: 'color', name: 'Color Reflex', icon: Palette, color: 'bg-violet-500', desc: 'Uji ketangkasan warnamu.' },
  ];

  const handleBack = () => {
    if (activeGame) {
      setShowExitConfirm(true);
    } else {
      setActiveGame(null);
    }
  };

  const confirmExit = () => {
    setActiveGame(null);
    setShowExitConfirm(false);
  };

  return (
    <div className="space-y-12">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl lg:text-6xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">FinGames Centre</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">Mainkan mini games seru sambil belajar mengelola keuangan. Dapatkan skor tertinggi!</p>
      </motion.div>

      <div className="relative min-h-[600px]">
        <AnimatePresence mode="wait">
          {!activeGame ? (
            <motion.div 
              key="game-list"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: 'blur(10px)' }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {games.map((game, i) => (
                <motion.button
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0, transition: { delay: i * 0.1 } }}
                  whileHover={{ y: -10, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveGame(game.id as GameType)}
                  className="group p-8 glass rounded-[32px] border border-white dark:border-white/5 text-left shadow-sm hover:shadow-2xl transition-shadow"
                >
                  <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:rotate-12 transition-transform", game.color)}>
                    <game.icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white">{game.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{game.desc}</p>
                </motion.button>
              ))}
            </motion.div>
          ) : (
            <motion.div 
              key="active-game"
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full glass rounded-[40px] border border-white dark:border-white/5 p-8 min-h-[600px] flex flex-col shadow-2xl relative overflow-hidden"
            >
               <motion.div 
                 initial={{ opacity: 0, x: -20 }}
                 animate={{ opacity: 1, x: 0 }}
                 className="flex justify-between items-center mb-8 relative z-10"
               >
                  <div className="flex items-center gap-4">
                    <button onClick={handleBack} className="p-3 bg-white/50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-700 rounded-2xl transition-all shadow-sm border border-slate-100 dark:border-white/5 group">
                      <RefreshCcw className="w-5 h-5 text-slate-400 dark:text-slate-500 group-hover:rotate-180 transition-transform duration-500" />
                    </button>
                    <div className="space-y-0.5">
                      <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">{games.find(g => g.id === activeGame)?.name}</h2>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Mini Game Mode</p>
                    </div>
                  </div>
                  <div className="px-5 py-2 bg-slate-900 dark:bg-primary text-white rounded-2xl text-[10px] font-bold tracking-widest uppercase shadow-lg shadow-slate-900/10 dark:shadow-primary/20">Live Play</div>
               </motion.div>
               
               <motion.div 
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0, transition: { delay: 0.2 } }}
                 className="flex-1 bg-slate-50 dark:bg-slate-900/40 rounded-[32px] overflow-hidden relative border border-slate-100/50 dark:border-white/5 shadow-inner"
               >
                  {activeGame === 'quiz' && <QuizGame />}
                  {activeGame === 'tap' && <TapGame />}
                  {activeGame === 'color' && <ColorGame />}
                  {activeGame === 'memory' && <MemoryGame />}
                  {activeGame === 'coin' && <CoinCatchGame />}
               </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showExitConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 text-center">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowExitConfirm(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="relative w-full max-w-sm glass p-8 rounded-[40px] border border-white dark:border-white/5 shadow-2xl space-y-6">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/30 text-rose-500 rounded-3xl flex items-center justify-center mx-auto">
                <Gamepad2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-heading font-bold text-slate-900 dark:text-white">Keluar Game?</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Progress dan skor kamu dalam sesi ini akan hilang.</p>
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setShowExitConfirm(false)} className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 rounded-2xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Lanjut Main</button>
                <button onClick={confirmExit} className="flex-1 py-4 bg-rose-500 text-white rounded-2xl font-bold hover:bg-rose-600 shadow-xl shadow-rose-500/20 transition-all">Ya, Keluar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Simple Game Components
function QuizGame() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const questions = [
    { q: "Menabung diawal bulan lebih baik daripada diakhir bulan?", a: true, e: "Menabung diawal menjamin alokasi tabungan aman dari pengeluaran impulsif." },
    { q: "Self reward setiap hari adalah hal yang hemat?", a: false, e: "Self reward yang terlalu sering justru merusak rencana keuangan (boros)." },
    { q: "Cicilan barang konsumtif maksimal 30% dari pendapatan?", a: true, e: "Ini batas ideal agar cash flow tetap sehat untuk kebutuhan pokok." },
    { q: "Investasi dulu baru buat dana darurat?", a: false, e: "Dana darurat wajib dipenuhi dulu sebagai jaring pengaman sebelum berinvestasi." },
    { q: "FinTag membantu mencatat pengeluaran mahasiswa?", a: true, e: "Didesain khusus untuk membantu mahasiswa mengelola anggaran terbatas." },
    { q: "Beli kopi di cafe setiap hari lebih hemat daripada buat sendiri?", a: false, e: "Latte effect! Pengeluaran kecil yang sering bisa berjumlah besar di akhir bulan." },
    { q: "Asuransi adalah bentuk pemborosan?", a: false, e: "Asuransi adalah mitigasi risiko untuk menjaga aset/uang dari pengeluaran tak terduga." },
    { q: "Membayar tagihan tepat waktu bisa menghemat uang?", a: true, e: "Tepat! Kamu terhindar dari denda atau bunga keterlambatan." },
    { q: "Investasi emas adalah investasi jangka pendek?", a: false, e: "Emas cenderung untuk jangka panjang karena spread harga belinya." },
    { q: "Punya lebih dari satu sumber penghasilan sangat disarankan?", a: true, e: "Side hustle membantu mempercepat pencapaian finansial dan alternatif jika satu sumber terhenti." }
  ];

  const handleAnswer = (ans: boolean) => {
    const correct = ans === questions[step].a;
    setIsCorrect(correct);
    if (correct) setScore(s => s + 10);
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    if (step < questions.length - 1) setStep(s => s + 1);
    else {
      setFinished(true);
      confetti();
    }
  };

  if (finished) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
      <Trophy className="w-20 h-20 text-amber-500 animate-bounce" />
      <h2 className="text-4xl font-heading font-bold dark:text-white">Skor Kamu: {score}</h2>
      <p className="text-slate-500 dark:text-slate-400">Hebat! Kamu mulai memahami konsep finansial sehat.</p>
    </div>
  );

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center space-y-4">
        <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Pertanyaan {step + 1} / {questions.length}</p>
        <h3 className="text-2xl font-medium text-slate-800 dark:text-slate-100 leading-relaxed max-w-lg">{questions[step].q}</h3>
      </div>

      <AnimatePresence mode="wait">
        {!showExplanation ? (
          <motion.div 
            key="options"
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="flex gap-4 w-full max-w-sm"
          >
            <button onClick={() => handleAnswer(true)} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all uppercase">Hemat</button>
            <button onClick={() => handleAnswer(false)} className="flex-1 bg-rose-500 text-white py-4 rounded-2xl font-bold shadow-lg shadow-rose-500/20 hover:scale-105 active:scale-95 transition-all uppercase">Boros</button>
          </motion.div>
        ) : (
          <motion.div 
            key="explanation"
            initial={{ opacity: 0, scale: 0.9 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="w-full max-w-md bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-white/5 shadow-xl space-y-4"
          >
            <div className={cn("inline-flex px-3 py-1 rounded-full text-[10px] font-bold uppercase", isCorrect ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400")}>
              {isCorrect ? 'Benar!' : 'Salah!'}
            </div>
            <p className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed font-medium">{questions[step].e}</p>
            <button onClick={nextQuestion} className="w-full py-3 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold text-sm">Lanjut</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TapGame() {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      setIsPlaying(false);
      confetti();
    }
  }, [isPlaying, timeLeft]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-8">
      {timeLeft > 0 ? (
        <>
          <div className="text-center">
            <h2 className="text-6xl font-bold text-slate-900 dark:text-white">{score}</h2>
            <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-2">Score</p>
          </div>
          <div className="text-2xl font-mono bg-slate-900 dark:bg-slate-800 text-white px-6 py-2 rounded-xl">00:{timeLeft.toString().padStart(2, '0')}</div>
          <button 
           onClick={() => isPlaying ? setScore(s => s + 1) : setIsPlaying(true)}
           className="w-48 h-48 rounded-full bg-primary text-white font-bold text-2xl shadow-2xl shadow-primary/40 active:scale-90 transition-transform"
          >
            {isPlaying ? 'TAP ME!' : 'START'}
          </button>
        </>
      ) : (
        <div className="text-center space-y-6">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto" />
          <h2 className="text-4xl font-heading font-bold dark:text-white">Final Score: {score}</h2>
          <button onClick={() => { setScore(0); setTimeLeft(10); }} className="px-8 py-3 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold">Main Lagi</button>
        </div>
      )}
    </div>
  );
}

function ColorGame() {
  const [target, setTarget] = useState({ name: '', color: '' });
  const [options, setOptions] = useState<any[]>([]);
  const [score, setScore] = useState(0);
  
  const colors = [
    { name: 'Merah', hex: '#EF4444' },
    { name: 'Biru', hex: '#3B82F6' },
    { name: 'Hijau', hex: '#10B981' },
    { name: 'Kuning', hex: '#F59E0B' },
  ];

  const nextRound = () => {
    const picked = colors[Math.floor(Math.random() * colors.length)];
    const displayed = colors[Math.floor(Math.random() * colors.length)];
    setTarget({ name: picked.name, color: displayed.hex });
    setOptions([...colors].sort(() => Math.random() - 0.5));
  };

  useEffect(() => nextRound(), []);

  const handlePick = (hex: string) => {
    if (hex === colors.find(c => c.name === target.name)?.hex) {
      setScore(s => s + 1);
      nextRound();
    } else {
      setScore(Math.max(0, score - 1));
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-12">
      <div className="text-center">
         <h2 className="text-5xl font-bold mb-4" style={{ color: target.color }}>{target.name}</h2>
         <p className="text-slate-400 dark:text-slate-500 font-bold uppercase text-xs tracking-widest font-mono">Pilih Warna BERDASARKAN TEKS</p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
        {options.map((opt, i) => (
          <button key={i} onClick={() => handlePick(opt.hex)} className="h-16 rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all" style={{ backgroundColor: opt.hex }} />
        ))}
      </div>
      <div className="text-2xl font-bold text-slate-900 dark:text-white bg-white dark:bg-slate-800 px-8 py-3 rounded-2xl shadow-sm border border-slate-100 dark:border-white/5">Score: {score}</div>
    </div>
  );
}

// Memory Match Game
function MemoryGame() {
  const iconPool = [Brain, Zap, Trophy, Target, Utensils, Gamepad2, ShoppingBag, Wallet, BarChart3, Users];
  const [level, setLevel] = useState(1);
  const [cards, setCards] = useState<any[]>([]);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [solved, setSolved] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);

  const startLevel = (lvl: number) => {
    // Level 1: 4 cards, Level 2: 8 cards, Level 3: 12 cards, Level 4: 16 cards, Level 5: 20 cards
    const pairCount = lvl * 2;
    const selectedIcons = iconPool.slice(0, pairCount);
    const deck = [...selectedIcons, ...selectedIcons]
      .sort(() => Math.random() - 0.5)
      .map((Icon, i) => ({ id: i, Icon }));
    setCards(deck);
    setFlipped([]);
    setSolved([]);
  };

  useEffect(() => {
    startLevel(level);
  }, [level]);

  const handleFlip = (id: number) => {
    if (flipped.length === 2 || solved.includes(id) || flipped.includes(id)) return;
    const newFlipped = [...flipped, id];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      if (cards[newFlipped[0]].Icon === cards[newFlipped[1]].Icon) {
        const nextSolved = [...solved, ...newFlipped];
        setSolved(nextSolved);
        setFlipped([]);
        
        if (nextSolved.length === cards.length) {
          if (level < 5) {
            setTimeout(() => {
              confetti();
              setLevel(l => l + 1);
            }, 800);
          } else {
            confetti();
            setIsFinished(true);
          }
        }
      } else {
        setTimeout(() => setFlipped([]), 1000);
      }
    }
  };

  if (isFinished) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 space-y-6 text-center">
        <Trophy className="w-20 h-20 text-emerald-500" />
        <h2 className="text-3xl font-bold dark:text-white">Luar Biasa!</h2>
        <p className="text-slate-500 dark:text-slate-400">Kamu telah menyelesaikan 5 level Memory Match.</p>
        <button onClick={() => { setLevel(1); setIsFinished(false); }} className="px-8 py-3 bg-slate-900 dark:bg-primary text-white rounded-xl font-bold">Main Lagi</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 space-y-8">
      <div className="text-center">
        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1">Level {level} / 5</p>
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Cari Pasangan Gambar</h3>
      </div>
      <div className={cn(
        "grid gap-4",
        level === 1 ? "grid-cols-2" : level <= 3 ? "grid-cols-4" : "grid-cols-5"
      )}>
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.id) || solved.includes(card.id);
          return (
            <button 
              key={card.id} 
              onClick={() => handleFlip(card.id)}
              className={cn(
                "w-14 h-14 md:w-16 md:h-16 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm border",
                isFlipped ? "bg-white dark:bg-slate-800 rotate-0 border-emerald-100 dark:border-emerald-500/20" : "bg-slate-900 dark:bg-slate-950 rotate-180 border-slate-700"
              )}
            >
              <AnimatePresence>
                {isFlipped && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <card.Icon className="w-8 h-8 text-emerald-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Simplified Coin Catch Game (High-Performance HTML5 Canvas on requestAnimationFrame)
function CoinCatchGame() {
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({
    basketPct: 50,
    targetBasketPct: 50,
    coins: [] as Array<{
      id: string;
      x: number;
      y: number;
      speed: number;
      radius: number;
      angle: number;
      spinSpeed: number;
      pulse: number;
    }>,
    particles: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      life: number;
      color: string;
      rotation: number;
    }>,
    score: 0,
    lives: 3,
    lastSpawn: 0,
    animationFrameId: 0,
    width: 0,
    height: 0
  });

  const spawnParticles = (x: number, y: number) => {
    const list = stateRef.current.particles;
    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4.5;
      list.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: -1.0 - Math.random() * 4,
        size: 1.8 + Math.random() * 2.8,
        life: 1.0,
        color: Math.random() > 0.4 ? '#10B981' : '#FBBF24', // Emerald accent or Rich Gold
        rotation: Math.random() * Math.PI
      });
    }
    // Crop excess particles to avoid memory growth
    if (list.length > 80) {
      list.splice(0, list.length - 80);
    }
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Set initial size
    const resizeCanvas = () => {
      const container = containerRef.current;
      if (!container || !canvas) return;
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }

      stateRef.current.width = rect.width;
      stateRef.current.height = rect.height;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Reset loop state variables on start
    stateRef.current.basketPct = 50;
    stateRef.current.targetBasketPct = 50;
    stateRef.current.coins = [];
    stateRef.current.particles = [];
    stateRef.current.score = 0;
    stateRef.current.lives = 3;
    stateRef.current.lastSpawn = 0;

    setScore(0);
    setLives(3);

    // Main animation loop inside browser vsync cycles
    const updateAndRender = (timestamp: number) => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { width, height } = stateRef.current;
      if (width === 0 || height === 0) {
        stateRef.current.animationFrameId = requestAnimationFrame(updateAndRender);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // 1. Interpolate Basket movement smoothly
      stateRef.current.basketPct += (stateRef.current.targetBasketPct - stateRef.current.basketPct) * 0.22;

      // 2. Controlled adaptive interval spawning of Coin items
      const spawnCooldown = Math.max(500, 1100 - stateRef.current.score * 7);
      if (timestamp - stateRef.current.lastSpawn > spawnCooldown) {
        stateRef.current.coins.push({
          id: `${timestamp}-${Math.random()}`,
          x: 6 + Math.random() * 88,
          y: -20,
          speed: 2.2 + Math.random() * 2.5 + Math.min(3.5, stateRef.current.score * 0.05),
          radius: 12.5,
          angle: 0,
          spinSpeed: -0.06 + Math.random() * 0.12,
          pulse: 1
        });
        stateRef.current.lastSpawn = timestamp;
      }

      // 3. Process coins sequence and detect matches inside the mesh bucket rim
      const remainingCoins: any[] = [];
      const basketPixelY = height - 48;
      const basketPixelX = (stateRef.current.basketPct / 100) * width;
      const basketW = 96;

      let scoreDelta = 0;
      let livesMissed = 0;

      for (const coin of stateRef.current.coins) {
        coin.y += coin.speed;
        coin.angle += coin.spinSpeed;

        const coinPixelX = (coin.x / 100) * width;
        const coinPixelY = coin.y;

        const distanceX = Math.abs(coinPixelX - basketPixelX);
        const isCaught = coinPixelY >= basketPixelY - 12 && coinPixelY <= basketPixelY + 12 && distanceX < basketW / 2 + 5;
        const isMissed = coinPixelY > height + 20;

        if (isCaught) {
          scoreDelta += 10;
          spawnParticles(coinPixelX, coinPixelY);
        } else if (isMissed) {
          livesMissed++;
        } else {
          remainingCoins.push(coin);

          // Render high-fidelity 3D-like gold coin vector
          ctx.save();
          
          // Outer subtle glow
          ctx.shadowBlur = 6;
          ctx.shadowColor = 'rgba(245, 158, 11, 0.4)';

          // Radial gold metal gradient
          const goldGrad = ctx.createRadialGradient(
            coinPixelX, coinPixelY, coin.radius * 0.15,
            coinPixelX, coinPixelY, coin.radius
          );
          goldGrad.addColorStop(0, '#FDE047'); // Light yellow gold
          goldGrad.addColorStop(0.65, '#F59E0B'); // Warm amber gold
          goldGrad.addColorStop(1, '#B45309'); // Dark solid gold-copper
          
          ctx.fillStyle = goldGrad;
          ctx.beginPath();
          ctx.arc(coinPixelX, coinPixelY, coin.radius, 0, Math.PI * 2);
          ctx.fill();

          ctx.shadowBlur = 0; // Reset shadow rendering output

          // Outer luxury emboss layer line
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
          ctx.lineWidth = 1.0;
          ctx.beginPath();
          ctx.arc(coinPixelX, coinPixelY, coin.radius * 0.82, 0, Math.PI * 2);
          ctx.stroke();

          // Coin value symbol (spinning '$')
          ctx.save();
          ctx.translate(coinPixelX, coinPixelY);
          ctx.rotate(coin.angle);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 12px "Inter", "Outfit", sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('$', 0, 0.5);
          ctx.restore();

          ctx.restore();
        }
      }
      stateRef.current.coins = remainingCoins;

      // 4. Update and render particle splashes
      const remainingParticles: any[] = [];
      for (const p of stateRef.current.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.13; // Gravity effect
        p.life -= 0.035;
        p.rotation += 0.08;

        if (p.life > 0) {
          remainingParticles.push(p);

          ctx.save();
          ctx.globalAlpha = p.life;
          ctx.fillStyle = p.color;

          ctx.translate(p.x, p.y);
          ctx.rotate(p.rotation);

          // Draw vector sparkle cross stars
          ctx.beginPath();
          for (let j = 0; j < 4; j++) {
            ctx.lineTo(0, -p.size * 1.5);
            ctx.lineTo(p.size * 0.4, -p.size * 0.4);
            ctx.rotate(Math.PI / 2);
          }
          ctx.fill();
          ctx.restore();
        }
      }
      stateRef.current.particles = remainingParticles;

      // 5. Draw smooth bento-style composite Basket
      const bW = basketW;
      const bH = 20;
      const bX = basketPixelX - bW / 2;
      const bY = basketPixelY;

      ctx.save();

      // Horizontal subtle gradient for shiny metallic frame
      const bodyGrad = ctx.createLinearGradient(bX, bY, bX + bW, bY);
      bodyGrad.addColorStop(0, '#1E293B');
      bodyGrad.addColorStop(0.45, '#334155');
      bodyGrad.addColorStop(0.55, '#334155');
      bodyGrad.addColorStop(1, '#1E293B');

      ctx.fillStyle = bodyGrad;
      ctx.beginPath();
      
      const r = 8;
      ctx.moveTo(bX + r, bY);
      ctx.lineTo(bX + bW - r, bY);
      ctx.quadraticCurveTo(bX + bW, bY, bX + bW, bY + r);
      ctx.lineTo(bX + bW - r * 0.5, bY + bH - r);
      ctx.quadraticCurveTo(bX + bW - r * 0.5, bY + bH, bX + bW - r * 1.5, bY + bH);
      ctx.lineTo(bX + r * 1.5, bY + bH);
      ctx.quadraticCurveTo(bX + r * 0.5, bY + bH, bX + r * 0.5, bY + bH - r);
      ctx.lineTo(bX, bY + r);
      ctx.quadraticCurveTo(bX, bY, bX + r, bY);
      ctx.closePath();
      ctx.fill();

      // Energetic Emerald accent bar
      ctx.strokeStyle = '#10B981';
      ctx.lineWidth = 3.2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(bX + 4, bY);
      ctx.lineTo(bX + bW - 4, bY);
      ctx.stroke();

      // Inner white glossy edge highlight
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(bX + 6, bY + 4);
      ctx.lineTo(bX + bW - 6, bY + 4);
      ctx.stroke();

      ctx.restore();

      // 6. Selective React-state batch synchronization on exact updates
      if (scoreDelta > 0) {
        stateRef.current.score += scoreDelta;
        setScore(stateRef.current.score);
      }

      if (livesMissed > 0) {
        stateRef.current.lives = Math.max(0, stateRef.current.lives - livesMissed);
        setLives(stateRef.current.lives);
        if (stateRef.current.lives <= 0) {
          setGameOver(true);
          confetti();
          return; // Escape RAF trigger loop organically
        }
      }

      stateRef.current.animationFrameId = requestAnimationFrame(updateAndRender);
    };

    stateRef.current.animationFrameId = requestAnimationFrame(updateAndRender);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(stateRef.current.animationFrameId);
    };
  }, [gameStarted, gameOver]);

  // Handle move logic securely translating touch positions
  const handleInteraction = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    if (rect.width === 0) return;
    const px = Math.max(0, Math.min(rect.width, clientX - rect.left));
    stateRef.current.targetBasketPct = (px / rect.width) * 100;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    handleInteraction(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches && e.touches[0]) {
      handleInteraction(e.touches[0].clientX);
    }
  };

  if (!gameStarted) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 space-y-6">
        <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/20 rounded-3xl flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/10">
          <Zap className="w-10 h-10" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-heading font-bold text-slate-900 dark:text-white">Coin Catch</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto text-sm">Gerakkan keranjang dengan kursor/jari dan tangkap koin emas!</p>
        </div>
        <button 
          onClick={() => setGameStarted(true)} 
          className="px-10 py-4 bg-slate-900 dark:bg-primary text-white rounded-[24px] font-bold hover:scale-105 active:scale-95 transition-all shadow-xl shadow-slate-900/20 dark:shadow-primary/20"
        >
          Mulai Main
        </button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 space-y-6 text-center">
        <Trophy className="w-20 h-20 text-amber-500 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-4xl font-heading font-bold text-slate-900 dark:text-white">Game Over!</h2>
          <p className="text-slate-500 dark:text-slate-400">Skor Akhir: <span className="text-primary font-bold">{score}</span></p>
        </div>
        <button 
          onClick={() => { 
            setScore(0); 
            setLives(3); 
            setGameOver(false); 
            setGameStarted(false); 
          }} 
          className="px-10 py-4 bg-slate-900 dark:bg-primary text-white rounded-[24px] font-bold hover:bg-primary transition-colors cursor-pointer"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchMove}
      className="h-full min-h-[400px] relative overflow-hidden bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 cursor-crosshair touch-none select-none"
    >
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20 pointer-events-none">
        <div className="px-6 py-2 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-white dark:border-white/5 font-bold text-slate-900 dark:text-white">
           Score: {score}
        </div>
        <div className="flex gap-1.5 p-2 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-white dark:border-white/5">
          {[...Array(3)].map((_, i) => (
            <motion.div 
              key={i} 
              initial={false}
              animate={{ 
                scale: i < lives ? [1, 1.2, 1] : 0.8,
                opacity: i < lives ? 1 : 0.35
              }}
              className="transition-all duration-300"
            >
              <Heart className={cn("w-5 h-5", i < lives ? "text-rose-500 fill-rose-500 shadow-rose-500/20" : "text-slate-300 dark:text-slate-600")} />
            </motion.div>
          ))}
        </div>
      </div>

      <canvas 
        ref={canvasRef} 
        className="absolute inset-0 block w-full h-full"
      />
    </div>
  );
}

const Pizza = (props: any) => <Utensils {...props} />;
