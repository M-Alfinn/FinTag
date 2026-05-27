import { motion } from 'motion/react';
import { ChevronRight, ArrowRight, Zap, Target, Smartphone, Sparkles, Wallet, BarChart3, Clock, Coffee } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

export default function LandingPage() {
  const [text, setText] = useState('');
  const phrases = ["Tap.", "Track.", "Selesai."];
  const [index, setIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFloat, setShowFloat] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isDeleting && charIndex < phrases[index].length) {
        setText(prev => prev + phrases[index][charIndex]);
        setCharIndex(prev => prev + 1);
      } else if (isDeleting && charIndex > 0) {
        setText(prev => prev.slice(0, -1));
        setCharIndex(prev => prev - 1);
      } else if (!isDeleting && charIndex === phrases[index].length) {
        if (phrases[index] === "Selesai.") {
          setShowFloat(true);
        }
        setTimeout(() => setIsDeleting(true), 1500);
      } else if (isDeleting && charIndex === 0) {
        setIsDeleting(false);
        setIndex(prev => (prev + 1) % phrases.length);
        setShowFloat(false);
      }
    }, isDeleting ? 40 : 80);

    return () => clearTimeout(timeout);
  }, [charIndex, isDeleting, index]);

  return (
    <div className="flex flex-col gap-6 lg:gap-8 pb-20">
      {/* Bento Grid Container */}
      <section className="grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-4 lg:gap-6 min-h-[85vh]">
        
        {/* Hero Section - col-span-8 row-span-2 */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-8 md:row-span-3 bg-white dark:bg-slate-900/60 rounded-[40px] p-8 lg:p-12 text-slate-900 dark:text-white relative overflow-hidden flex flex-col justify-between shadow-xl border border-white dark:border-white/5 transition-colors group"
        >
          <div className="z-10 space-y-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-white/5"
            >
              <Sparkles className="w-3 h-3 text-primary" />
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Next-Gen Financial Tracker</span>
            </motion.div>
            <h1 className="text-4xl lg:text-7xl font-heading font-black tracking-tight uppercase leading-[0.9] italic">
              Tap Smart,<br/>
              <span className="text-primary group-hover:text-emerald-400 transition-colors">Track Smart.</span>
            </h1>
            <p className="text-slate-600 dark:text-slate-400 font-mono tracking-widest text-[10px]">FINTAG // MANUAL READY // KELOMPOK 3</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6 z-10 pt-8 sm:pt-0">
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-3xl lg:text-4xl font-heading font-bold text-slate-500 dark:text-slate-400">
                <motion.span
                  key={text}
                  initial={{ scale: 1 }}
                  animate={(text === "Track." || text === "Selesai.") ? { scale: [1, 1.1, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  {text}
                </motion.span>
                <span className="w-1.5 h-8 bg-primary animate-pulse" />
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed font-medium">
                Kelola keuanganmu dalam sekejap dengan tracker pintar. Spesialis budget kontrol untuk kehidupan mahasiswa yang produktif.
              </p>
            </div>
            <Link to="/tracker" className="bg-primary hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
               START TRACKING <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Abstract shapes */}
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary rounded-full blur-[80px] opacity-10 dark:opacity-5"></div>
          <div className="absolute right-20 -bottom-10 w-40 h-40 bg-slate-100 dark:bg-primary rounded-full blur-[60px] opacity-20 dark:opacity-5"></div>
        </motion.div>

        {/* Info Card / Spending - col-span-4 row-span-4 */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={showFloat ? { 
            opacity: 1,
            scale: 1,
            y: [0, -6, 0],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut" } 
          } : { opacity: 1, scale: 1 }}
          transition={!showFloat ? { delay: 0.1 } : undefined}
          className="md:col-span-4 md:row-span-4 bento-card flex flex-col p-8"
        >
          <div className="flex justify-between items-center mb-8">
            <div className="space-y-1">
              <h3 className="font-bold text-lg leading-none dark:text-white">Pengeluaran</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Analitik Mingguan</p>
            </div>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-lg font-bold">-12.5%</span>
          </div>

          <div className="flex-1 flex items-end gap-3 px-2 min-h-[160px]">
            <div className="flex-1 bg-primary/20 rounded-t-lg h-[40%] relative group cursor-help transition-all hover:h-[45%]">
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rp 15k</div>
            </div>
            <div className="flex-1 bg-primary/40 rounded-t-lg h-[60%] relative group cursor-help transition-all hover:h-[65%]">
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rp 22k</div>
            </div>
            <div className="flex-1 bg-primary rounded-t-lg h-[90%] relative group cursor-help transition-all hover:h-[95%]">
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rp 45k</div>
            </div>
            <div className="flex-1 bg-primary/30 rounded-t-lg h-[55%] relative group cursor-help transition-all hover:h-[60%]">
               <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 dark:text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Rp 18k</div>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner" style={showFloat ? { animation: 'float 3s ease-in-out infinite' } : {}}>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Hemat</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Rp 240k</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-white/5 shadow-inner">
              <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wider mb-1">Boros</p>
              <p className="text-base font-bold text-rose-500 dark:text-rose-400 text-right">Rp 12k</p>
            </div>
          </div>
        </motion.div>

        {/* Feature 1 - Product Showcase */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={showFloat ? { 
            opacity: 1,
            y: [0, -4, 0],
            transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.4 } 
          } : { opacity: 1, y: 0 }}
          transition={!showFloat ? { delay: 0.2 } : undefined}
          className="md:col-span-4 md:row-span-3 bg-white dark:bg-slate-900/60 border border-slate-100 dark:border-white/5 rounded-3xl p-8 relative group flex flex-col justify-between overflow-hidden shadow-sm transition-colors"
        >
          <div className="absolute top-8 right-8 z-10">
            <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-full text-[10px] font-bold border border-slate-200 dark:border-slate-700 shadow-sm text-slate-900 dark:text-white">Rp 15.000</div>
          </div>
          <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-3xl shadow-xl flex items-center justify-center p-4 transform -rotate-12 transition-all duration-500 group-hover:rotate-0 group-hover:scale-110 z-10 border border-slate-100 dark:border-white/5">
            <div className="w-full h-full rounded-2xl bg-primary/10 border-2 border-dashed border-primary flex items-center justify-center text-[10px] font-bold text-primary">NFC</div>
          </div>
          <div className="z-10 pt-8">
            <h4 className="font-bold text-xl leading-tight text-slate-900 dark:text-white">Gantungan Kunci NFC PRO</h4>
            <p className="text-xs text-slate-500 dark:text-slate-300 mt-2 font-medium">Acrylic Keychain Premium dengan NFC NTAG 213</p>
            <Link to="/shop" className="mt-4 flex items-center gap-2 text-xs font-bold text-primary group-hover:gap-3 transition-all uppercase tracking-wider">
              LIHAT TOKO <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary/5 rounded-full blur-[40px] transition-all group-hover:bg-primary/10" />
        </motion.div>


        {/* Feature 2 - Daily Quote */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={showFloat ? { 
            opacity: 1,
            y: [0, -8, 0],
            transition: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.2 } 
          } : { opacity: 1, y: 0 }}
          transition={!showFloat ? { delay: 0.3 } : undefined}
          className="md:col-span-4 md:row-span-3 bg-primary rounded-3xl p-10 text-white flex flex-col justify-center items-center text-center shadow-lg shadow-primary/20 relative overflow-hidden"
        >
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70 mb-4 z-10">Daily Inspiration</span>
          <p className="text-xl lg:text-2xl font-serif italic mb-6 leading-relaxed z-10">
            "Habit kecil hari ini menentukan kesuksesanmu di hari esok."
          </p>
          <div className="w-12 h-1 bg-white/30 rounded-full z-10"></div>
          <div className="absolute top-0 right-0 p-4 opacity-20">
            <Coffee className="w-20 h-20 rotate-12" />
          </div>
        </motion.div>

        {/* Mini Stats / Links */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={showFloat ? { 
            opacity: 1,
            y: [0, -3, 0],
            transition: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 } 
          } : { opacity: 1, y: 0 }}
          transition={!showFloat ? { delay: 0.4 } : undefined}
          className="md:col-span-4 md:row-span-2 bento-card flex flex-col justify-center gap-4"
        >
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                   <Target className="w-5 h-5" />
                </div>
                <div>
                   <p className="text-xs font-bold dark:text-white">Progress Target</p>
                   <p className="text-[10px] text-slate-500 dark:text-slate-400">Budget Bulan Ini</p>
                </div>
             </div>
             <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">82%</p>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: "82%" }}
               transition={{ duration: 1, delay: 1 }}
               className="h-full bg-indigo-500" 
             />
          </div>
        </motion.div>
      </section>

      {/* Secondary Features Section */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
        <FeatureCard 
          icon={Zap}
          title="Super Fast Tracking"
          description="Catat pengeluaran hanya dalam hitungan detik dengan sistem input manual yang intuitif."
          isFloating={showFloat}
          delay={1.2}
        />
        <FeatureCard 
          icon={BarChart3}
          title="Detailed Analytics"
          description="Pantau budget mahasiswa kamu dengan grafik yang estetik dan mudah dibaca."
          isFloating={showFloat}
          delay={1.4}
        />
        <FeatureCard 
          icon={Clock}
          title="Productivity Pack"
          isFloating={showFloat}
          delay={1.6}
          description="Dilengkapi dengan Pomodoro Timer dan AI Assistant untuk mendukung belajarmu."
        />
      </section>

      {/* NEW: Logo / Trusted By Bar */}
      <motion.section 
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="py-12 border-y border-slate-100 dark:border-white/5 flex flex-wrap justify-center items-center gap-8 lg:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all font-heading font-black text-xs lg:text-sm tracking-[0.3em] text-slate-400"
      >
        <div className="flex items-center gap-2">
           <Smartphone className="w-4 h-4" />
           <span>TAP-TO-TRACK</span>
        </div>
        <div className="flex items-center gap-2">
           <Zap className="w-4 h-4" />
           <span>NTAG213 CHIP</span>
        </div>
        <div className="flex items-center gap-2">
           <Sparkles className="w-4 h-4" />
           <span>GEMINI AI READY</span>
        </div>
        <div className="flex items-center gap-2">
           <Target className="w-4 h-4" />
           <span>STUDENT PRODUCTIVITY</span>
        </div>
      </motion.section>

      {/* NEW: How It Works Section */}
      <section className="py-20 space-y-16">
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl lg:text-5xl font-heading font-black italic uppercase tracking-tight"
          >
            Cara Kerja <span className="text-primary italic">FinTag</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-slate-500 dark:text-slate-400 font-medium"
          >
            Teknologi canggih di balik kemudahan pengelolaan keuangan harianmu.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <StepCard 
            number="01"
            title="Miliki Gantungan NFC"
            description="Pasang gantungan kunci FinTag di tas, dompet, atau kunci motor kamu untuk akses cepat."
            delay={0}
          />
          <StepCard 
            number="02"
            title="Tap dengan Smartphone"
            description="Cukup dekatkan smartphone kamu ke gantungan kunci, dan dashboard tracking terbuka otomatis."
            delay={0.2}
          />
          <StepCard 
            number="03"
            title="Catat & Beres"
            description="Data transaksi masuk seketika. Awasi pengeluaranmu dari mana saja tanpa ribet."
            delay={0.4}
          />
        </div>
      </section>

      {/* NEW: High-Impact Stats Section */}
      <motion.section 
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-slate-900 dark:bg-slate-950 rounded-[48px] p-12 lg:p-20 text-white relative overflow-hidden"
      >
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <h2 className="text-4xl lg:text-6xl font-heading font-black italic leading-tight uppercase tracking-tighter text-white">
              Sudah <span className="text-primary">12.000+</span> Mahasiswa Berhemat.
            </h2>
            <p className="text-slate-400 text-lg font-medium leading-relaxed max-w-md">
              Bergabunglah dengan komunitas mahasiswa cerdas yang peduli dengan masa depan finansial mereka.
            </p>
            <div className="flex gap-4">
               <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                  <p className="text-3xl font-black text-primary italic">98%</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">Kepuasan</p>
               </div>
               <div className="bg-white/5 border border-white/10 p-6 rounded-3xl text-center">
                  <p className="text-3xl font-black text-indigo-400 italic">Rp 4.5M</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-2">Total Terlacak</p>
               </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-4 pt-12">
                <div className="aspect-square bg-white shadow-2xl rounded-3xl flex items-center justify-center p-8 group hover:scale-105 transition-transform">
                   <div className="w-full h-full bg-emerald-50 rounded-2xl flex items-center justify-center">
                      <Smartphone className="w-12 h-12 text-primary" />
                   </div>
                </div>
                <div className="aspect-[4/5] bg-emerald-500 rounded-3xl flex items-center justify-center p-12 overflow-hidden relative">
                   <Zap className="w-32 h-32 text-white/20 absolute -right-10 -bottom-10 rotate-12" />
                   <p className="text-xl font-black text-white italic z-10 uppercase tracking-tighter">REAL TIME DATA</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="aspect-[4/5] bg-indigo-500 rounded-3xl flex items-center justify-center p-12 overflow-hidden relative">
                   <BarChart3 className="w-32 h-32 text-white/20 absolute -left-10 -top-10 rotate-12" />
                   <p className="text-xl font-black text-white italic z-10 uppercase tracking-tighter leading-tight">DETAILED INSIGHTS</p>
                </div>
                <div className="aspect-square bg-slate-800 rounded-3xl p-8 flex flex-col justify-end">
                   <p className="text-3xl font-black text-primary italic">#1</p>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fintech App</p>
                </div>
             </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -mr-64 -mt-64" />
      </motion.section>

      {/* NEW: Testimonials Section */}
      <section className="py-20 space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
           <div className="space-y-4">
              <h2 className="text-3xl lg:text-4xl font-heading font-black italic uppercase tracking-tighter leading-none">Apa Kata Mereka?</h2>
              <p className="text-slate-500 font-medium">Testimoni nyata dari komunitas FinTag Indonesia.</p>
           </div>
           <div className="flex gap-2">
              <div className="w-10 h-10 border border-slate-200 dark:border-white/10 rounded-full flex items-center justify-center text-slate-400">
                 <ArrowRight className="w-4 h-4 rotate-180" />
              </div>
              <div className="w-10 h-10 border border-slate-900 bg-slate-900 text-white rounded-full flex items-center justify-center">
                 <ArrowRight className="w-4 h-4" />
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <TestimonialCard 
             name="Adit Prasetyo"
             role="Mahasiswa Teknik UI"
             text="Gila sih, dulu catat manual capek banget. Sekarang tinggal tap gantungan kunci di tas, data langsung masuk. UX-nya clean abis!"
             delay={0}
           />
           <TestimonialCard 
             name="Sarah Amalia"
             role="Content Creator"
             text="Awalnya beli gantungan NFC-nya buat hiasan tas, eh malah ketagihan tracking. Budget bulanan jadi jauh lebih rapi."
             delay={0.1}
           />
           <TestimonialCard 
             name="Budi Santoso"
             role="Mahasiswa Semester Akhir"
             text="Pomodoro timer-nya ngebantu banget pas ngerjain skripsi. Sambil ngerjain, sambil pantau pengeluaran kopi harian."
             delay={0.2}
           />
        </div>
      </section>

      {/* NEW: Closing CTA */}
      <motion.section 
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="py-16 text-center space-y-8"
      >
        <div className="space-y-4">
          <h2 className="text-4xl lg:text-7xl font-heading font-black italic leading-[0.85] uppercase tracking-tighter">
            Siap untuk naik level <br/>
            <span className="text-primary italic">Finansialmu?</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
            Jangan biarkan uangmu hilang tanpa jejak. Mulai track sekarang juga dengan FinTag secara gratis!
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
           <Link to="/tracker" className="w-full sm:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-10 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest shadow-2xl flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95">
              MULAI GRATIS <ChevronRight className="w-5 h-5" />
           </Link>
           <Link to="/shop" className="w-full sm:w-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-10 py-5 rounded-[24px] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-slate-50 dark:hover:bg-white/5">
              BELI GANTUNGAN <Smartphone className="w-5 h-5" />
           </Link>
        </div>
      </motion.section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, isFloating, delay = 0 }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      whileHover={{ y: -5 }}
      animate={isFloating ? {
        y: [0, -3, 0],
        transition: { duration: 4, repeat: Infinity, ease: "easeInOut", delay }
      } : {}}
      className="bento-card space-y-6 group bg-white dark:bg-slate-900/60"
    >
      <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-primary transition-colors border border-slate-100 dark:border-white/5">
        <Icon className="w-7 h-7 text-slate-800 dark:text-slate-200 group-hover:text-white transition-colors" />
      </div>
      <div className="space-y-3">
        <h3 className="text-xl font-heading font-bold text-slate-900 dark:text-white leading-tight">{title}</h3>
        <p className="text-slate-600 dark:text-slate-100 leading-relaxed text-sm font-medium">{description}</p>
      </div>
    </motion.div>
  );
}

function StepCard({ number, title, description, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bento-card group hover:bg-primary transition-colors duration-500"
    >
      <p className="text-5xl font-black font-heading italic text-primary group-hover:text-white/40 mb-6 transition-all">{number}</p>
      <h3 className="text-xl font-heading font-bold dark:text-white group-hover:text-white transition-colors mb-3 leading-tight">{title}</h3>
      <p className="text-sm text-slate-500 dark:text-slate-400 group-hover:text-white/80 transition-colors font-medium leading-relaxed">{description}</p>
    </motion.div>
  );
}

function TestimonialCard({ name, role, text, delay }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bento-card space-y-6 bg-white dark:bg-slate-900/60 flex flex-col justify-between"
    >
      <p className="text-slate-600 dark:text-slate-200 font-serif italic text-lg leading-relaxed">"{text}"</p>
      <div className="flex items-center gap-4 border-t border-slate-100 dark:border-white/5 pt-6">
         <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-primary font-black text-[10px] uppercase">{name.charAt(0)}</div>
         <div>
            <p className="text-sm font-bold dark:text-white">{name}</p>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-0.5">{role}</p>
         </div>
      </div>
    </motion.div>
  );
}

