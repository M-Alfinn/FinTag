import { motion } from 'motion/react';
import { 
  Smartphone, Scan, Zap, CheckCircle2, ChevronRight, 
  MapPin, HelpCircle, Box, Layers, PlayCircle, Eye, Wallet
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';

export default function ARGuide() {
  const [activeTab, setActiveTab] = useState<'nfc' | 'ar'>('nfc');

  return (
    <div className="max-w-5xl mx-auto space-y-20 pb-20">
      <div className="text-center space-y-4">
        <h1 className="text-4xl lg:text-6xl font-heading font-bold text-slate-900 dark:text-white tracking-tight">Panduan FinTag</h1>
        <p className="text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Pelajari cara menghubungkan gantungan kunci NFC FinTag Anda dan memanfaatkan teknologi Augmented Reality.</p>
        
        <div className="flex justify-center gap-2 pt-4">
           {[
             { id: 'nfc', label: 'Panduan NFC' },
             { id: 'ar', label: 'Panduan AR' }
           ].map((tab) => (
             <button
               key={tab.id}
               onClick={() => setActiveTab(tab.id as any)}
               className={cn(
                 "px-8 py-3 rounded-2xl text-sm font-bold uppercase tracking-widest transition-all",
                 activeTab === tab.id 
                  ? "bg-slate-900 dark:bg-primary text-white shadow-xl" 
                  : "glass text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
               )}
             >
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12 items-start">
        {activeTab === 'nfc' ? (
          <>
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-12"
            >
               <div className="space-y-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-[28px] flex items-center justify-center">
                     <Zap className="w-8 h-8 text-primary" />
                  </div>
                  <h2 className="text-4xl font-heading font-bold text-slate-900 dark:text-white">NFC Keychain Guide</h2>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">Catat keuanganmu secara instan hanya dengan sekali ketukan menggunakan gantungan kunci NFC FinTag-mu.</p>
               </div>

               <div className="space-y-4">
                  {[
                    { t: "Aktifkan NFC di Handphone", d: "Masuk ke menu Pengaturan (Settings) di HP Anda, cari 'NFC', lalu pastikan fitur NFC dalam kondisi aktif.", icon: Smartphone },
                    { t: "Dekatkan HP ke Gantungan Akrilik", d: "Tempelkan atau dekatkan bagian belakang HP Anda secara lembut ke gantungan kunci akrilik FinTag milikmu.", icon: Zap },
                    { t: "Deteksi Chip NFC FinTag", d: "Handphone kamu akan otomatis mendeteksi chip performa tinggi NTAG213 di dalam gantungan akrilik dalam hitungan milidetik.", icon: HelpCircle },
                    { t: "Pencatatan Otomatis Aktif", d: "Link perekaman FinTag langsung terbuka dan transaksi instan siap tercatat dengan rapi tanpa mengetik panjang.", icon: PlayCircle },
                  ].map((step, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group p-6 glass rounded-[32px] border border-white dark:border-white/5 hover:border-primary/20 transition-all flex items-start gap-4"
                    >
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                        <step.icon className="w-5 h-5 text-slate-400 dark:text-slate-300 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{step.t}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-300 leading-relaxed mt-1">{step.d}</p>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative aspect-square glass rounded-[60px] p-12 border border-white dark:border-white/5 flex flex-col items-center justify-center overflow-hidden"
            >
               <div className="absolute inset-0 bg-primary/10 blur-[80px] rounded-full" />
               <motion.div 
                 animate={{ y: [0, -15, 0], rotate: [0, 2, 0] }}
                 transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                 className="relative z-10 w-full flex flex-col items-center text-center gap-6"
               >
                 {/* Visual Gantungan Kunci Acrylic NTAG213 */}
                 <div className="w-36 h-48 bg-white/20 dark:bg-slate-900/30 border-2 border-primary/40 rounded-[36px] p-4 flex flex-col items-center justify-between shadow-2xl backdrop-blur-md relative">
                   {/* Lubang Gantungan Kunci */}
                   <div className="w-4 h-4 rounded-full bg-slate-900/10 dark:bg-white/10 border border-primary/20 absolute top-4 left-1/2 -translate-x-1/2 flex items-center justify-center">
                     <div className="w-1.5 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800" />
                   </div>
                   
                   {/* Chip NFC inside */}
                   <div className="mt-8 flex flex-col items-center justify-center border border-dashed border-primary/30 rounded-full p-4 animate-pulse">
                     <Zap className="w-8 h-8 text-primary" />
                   </div>

                   <p className="font-mono text-[9px] text-slate-400 dark:text-slate-500 tracking-widest uppercase font-bold">NTAG213 SECURE CHIP</p>
                 </div>

                 <div className="space-y-2">
                    <p className="text-2xl font-heading font-bold text-slate-900 dark:text-white uppercase tracking-tighter">Gantungan Kunci NFC</p>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">Kombinasi stylish gantungan akrilik custom dengan chip NFC berkinerja tinggi.</p>
                 </div>
               </motion.div>
            </motion.div>
          </>
        ) : (
          <>
            <motion.div 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="space-y-12"
            >
               <div className="space-y-6">
                  <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-[28px] flex items-center justify-center">
                     <Box className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h2 className="text-4xl font-heading font-bold text-slate-900 dark:text-white">Scan & View AR</h2>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-lg">Lihat 3D mockup FinTag atau animasi khusus langsung di lingkunganmu menggunakan teknologi AR.</p>
               </div>

               <div className="space-y-4">
                  {[
                    { t: "Buka Kamera / Google Lens", d: "Gunakan aplikasi kamera bawaan atau Google Lens untuk scan QR.", icon: Eye },
                    { t: "Klik Link QR", d: "Buka link yang terdeteksi oleh kamera kamu.", icon: ChevronRight },
                    { t: "Pilih Mode AR", d: "Klik tombol 'View in AR' pada halaman yang muncul.", icon: Layers },
                    { t: "Ikuti Instruksi Kamera", d: "Gerakkan HP perlahan untuk mendeteksi permukaan lantai/meja.", icon: MapPin },
                  ].map((step, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group p-6 glass rounded-[32px] border border-white dark:border-white/5 hover:border-violet-200 transition-all flex items-start gap-4"
                    >
                      <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-violet-600 group-hover:text-white transition-all">
                        <step.icon className="w-5 h-5 dark:text-slate-400 group-hover:text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{step.t}</h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{step.d}</p>
                      </div>
                    </motion.div>
                  ))}
               </div>
            </motion.div>

            <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative aspect-square glass bg-white dark:bg-slate-900/40 rounded-[60px] p-12 border border-white dark:border-white/5 flex flex-col items-center justify-center gap-8 text-center"
            >
               <div className="w-48 h-48 bg-white dark:bg-slate-800 rounded-[40px] p-6 shadow-2xl border border-slate-100 dark:border-white/5 flex items-center justify-center">
                  <div className="w-full h-full border-4 border-slate-900 dark:border-white/20 rounded-2xl flex items-center justify-center p-2">
                     <Scan className="w-full h-full text-slate-900 dark:text-white opacity-20" />
                     <p className="absolute text-[10px] font-bold text-slate-900 dark:text-white uppercase tracking-[0.2em]">Scan QR Code</p>
                  </div>
               </div>
               <div className="space-y-2">
                  <p className="text-xl font-heading font-bold text-slate-900 dark:text-white">Virtual Preview</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Scan QR di atas untuk melihat desain FinTag kamu dalam 3D dan AR!</p>
               </div>
               <div className="px-6 py-3 bg-violet-600 text-white rounded-2xl flex items-center gap-2 text-sm font-bold shadow-lg shadow-violet-200/20">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Google Lens Ready</span>
               </div>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
