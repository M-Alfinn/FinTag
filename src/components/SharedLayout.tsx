import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wallet, ShoppingBag, Gamepad2, Trophy, Music, ChevronDown, Sparkles,
  Map, Clock, LayoutDashboard, Menu, X, Github, Sun, Moon, Info, Mail
} from 'lucide-react';
import { cn } from '../lib/utils';

function LogoIcon({ className, textClassName }: { className: string; textClassName?: string }) {
  const [hasError, setHasError] = useState(false);

  // Strip background colors and shadows if logo image is loaded successfully to keep it transparent
  const cleanClassName = !hasError 
    ? className
        .replace(/bg-[a-zA-Z0-9\-\/]+/g, '')
        .replace(/dark:bg-[a-zA-Z0-9\-\/]+/g, '')
        .replace(/shadow-[a-zA-Z0-9\-\/]+/g, '')
        .trim()
    : className;

  return (
    <div className={cn("overflow-hidden flex items-center justify-center transition-all shrink-0", cleanClassName)}>
      {!hasError ? (
        <img 
          src="/logo.png" 
          onError={() => setHasError(true)} 
          className="w-full h-full object-contain dark:[filter:invert(1)_hue-rotate(180deg)] transition-all duration-300" 
          alt="FinTag Logo"
          referrerPolicy="no-referrer"
        />
      ) : (
        <span className={cn(textClassName)}>F</span>
      )}
    </div>
  );
}

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFeatureDropdownOpen, setIsFeatureDropdownOpen] = useState(false);
  const [isMobileFeatureOpen, setIsMobileFeatureOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });
  const location = useLocation();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Click outside listener for feature dropdown (desktop)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFeatureDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const extraMenuItems = [
    { name: 'Music Hub', path: '/music', icon: Music, desc: 'Santai dengan musik pilihan', color: 'from-emerald-500/20 to-teal-500/20 text-emerald-600 dark:text-emerald-400' },
    { name: 'Pomodoro', path: '/pomodoro', icon: Clock, desc: 'Fokus belajar & produktif', color: 'from-amber-500/20 to-orange-500/20 text-amber-500' },
    { name: 'Mini Games', path: '/games', icon: Gamepad2, desc: 'Game finansial & ketangkasan', color: 'from-blue-500/20 to-indigo-500/20 text-indigo-500' },
    { name: 'Tantangan', path: '/challenge', icon: Trophy, desc: 'Komitmen hidup hemat & sehat', color: 'from-rose-500/20 to-pink-500/20 text-rose-500' },
    { name: 'Panduan', path: '/ar', icon: Map, desc: 'Petunjuk penggunaan NFC & AR', color: 'from-violet-500/20 to-purple-500/20 text-purple-500' },
    { name: 'Info FinTag', path: '/about', icon: Info, desc: 'Tentang produk & NFC Gantungan', color: 'from-slate-500/20 to-cool-500/20 text-slate-500' },
    { name: 'Hubungi Dev', path: '/feedback', icon: Mail, desc: 'Kirim kritik, saran & kesan ke team', color: 'from-indigo-500/20 to-violet-500/20 text-indigo-600 dark:text-indigo-400' },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
    setIsFeatureDropdownOpen(false);
    setIsMobileFeatureOpen(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/20 relative">
      {/* NO noise-overlay here to ensure super fast page frame rates on both mobile and desktop! */}
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 h-20 px-4 md:px-6 lg:px-12 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-50 transition-all">
        <Link to="/" className="flex items-center group shrink-0">
          <LogoIcon 
            className="w-44 h-16 md:w-56 md:h-20 bg-primary rounded-xl shadow-lg shadow-primary/20 transition-all" 
            textClassName="text-white font-bold w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-lg shadow-md"
          />
        </Link>

        {/* Desktop Menu - Fully reorganized per requirement */}
        <div className="hidden lg:flex items-center gap-1.5 ml-8">
          <Link 
            to="/"
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              location.pathname === '/' 
                ? "bg-primary/10 text-primary dark:bg-primary/20" 
                : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5"
            )}
          >
            <Wallet className="w-3.5 h-3.5" />
            Tracker
          </Link>

          <Link 
            to="/shop"
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              location.pathname === '/shop' 
                ? "bg-primary/10 text-primary dark:bg-primary/20" 
                : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5"
            )}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            Shop
          </Link>

          {/* Desktop Dropdown for "Fitur Lain" */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsFeatureDropdownOpen(!isFeatureDropdownOpen)}
              onMouseEnter={() => setIsFeatureDropdownOpen(true)}
              className={cn(
                "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
                extraMenuItems.some(item => location.pathname === item.path)
                  ? "bg-primary/10 text-primary dark:bg-primary/20"
                  : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fitur Lain</span>
              <ChevronDown className={cn("w-3 h-3 transition-transform duration-200", isFeatureDropdownOpen && "rotate-180")} />
            </button>

            <AnimatePresence>
              {isFeatureDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  onMouseLeave={() => setIsFeatureDropdownOpen(false)}
                  className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-3xl p-4 shadow-2xl z-50 grid grid-cols-1 gap-1"
                >
                  <p className="px-3 py-1.5 text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Aktivitas Mahasiswa</p>
                  {extraMenuItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex items-start gap-3 p-2.5 rounded-2xl transition-all group/item",
                        location.pathname === item.path 
                          ? "bg-slate-50 dark:bg-slate-800" 
                          : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                      )}
                    >
                      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br", item.color.split(' ')[0])}>
                        <item.icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className={cn("text-xs font-bold leading-tight transition-colors", location.pathname === item.path ? "text-primary" : "text-slate-900 dark:text-white group-hover/item:text-primary")}>{item.name}</p>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-none mt-1">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <Link 
            to="/admin"
            className={cn(
              "px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2",
              location.pathname === '/admin' 
                ? "bg-primary/10 text-primary dark:bg-primary/20" 
                : "text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-primary/5"
            )}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Admin
          </Link>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          {/* Quick theme toggle */}
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl hover:scale-105 active:scale-95 transition-all text-slate-600 dark:text-slate-300 pointer-events-auto"
            aria-label="Toggle theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <Link 
            to="/" 
            className="hidden sm:flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
          >
            CATAT SEKARANG
          </Link>
          
          <button 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-xl hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-white"
            aria-label="Open navigation menu"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Smooth & Lightweight (no heavy layout bindings) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 lg:hidden bg-white/98 dark:bg-slate-950/98 p-6 pt-24 flex flex-col overflow-y-auto"
          >
            <div className="flex-1 flex flex-col justify-start gap-4">
              <Link 
                to="/"
                className={cn(
                  "flex items-center gap-4 text-2xl font-heading font-black py-2.5 border-b border-slate-100 dark:border-white/5 uppercase tracking-tighter transition-all",
                  location.pathname === '/' ? "text-primary px-2" : "text-slate-800 dark:text-white/80"
                )}
              >
                <Wallet className="w-6 h-6 text-primary" />
                Catat Keuangan (Tracker)
              </Link>

              <Link 
                to="/shop"
                className={cn(
                  "flex items-center gap-4 text-2xl font-heading font-black py-2.5 border-b border-slate-100 dark:border-white/5 uppercase tracking-tighter transition-all",
                  location.pathname === '/shop' ? "text-primary px-2" : "text-slate-800 dark:text-white/80"
                )}
              >
                <ShoppingBag className="w-6 h-6 text-emerald-500" />
                Shop FinTag
              </Link>

              {/* Collapsible Mobile Menu for "Fitur Lain" */}
              <div className="border-b border-slate-100 dark:border-white/5 py-1">
                <button
                  onClick={() => setIsMobileFeatureOpen(!isMobileFeatureOpen)}
                  className="w-full flex items-center justify-between text-2xl font-heading font-black py-2 uppercase tracking-tighter text-slate-800 dark:text-white/80"
                >
                  <div className="flex items-center gap-4">
                    <Sparkles className="w-6 h-6 text-indigo-500 animate-pulse" />
                    <span>Fitur Lain</span>
                  </div>
                  <ChevronDown className={cn("w-5 h-5 transition-transform duration-200", isMobileFeatureOpen && "rotate-180")} />
                </button>

                <AnimatePresence initial={false}>
                  {isMobileFeatureOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden bg-slate-50 dark:bg-slate-900/40 rounded-3xl mt-2 p-3 grid grid-cols-2 gap-2"
                    >
                      {extraMenuItems.map((item) => (
                        <Link
                          key={item.path}
                          to={item.path}
                          className={cn(
                            "flex flex-col p-3 rounded-2xl border transition-all",
                            location.pathname === item.path
                              ? "bg-primary/20 border-primary text-primary"
                              : "bg-white dark:bg-slate-900 border-slate-100 dark:border-white/5 text-slate-800 dark:text-white"
                          )}
                        >
                          <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mb-2 bg-gradient-to-br", item.color.split(' ')[0])}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <p className="text-xs font-bold leading-tight">{item.name}</p>
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <Link 
                to="/admin"
                className={cn(
                  "flex items-center gap-4 text-2xl font-heading font-black py-2.5 border-b border-slate-100 dark:border-white/5 uppercase tracking-tighter transition-all",
                  location.pathname === '/admin' ? "text-primary px-2" : "text-slate-800 dark:text-white/80"
                )}
              >
                <LayoutDashboard className="w-6 h-6 text-rose-500" />
                Admin Dashboard
              </Link>
            </div>
            
            <div className="pt-6 mt-8 border-t border-slate-100 dark:border-white/5 flex flex-col gap-2">
              <p className="text-slate-400 dark:text-white/40 text-[10px] tracking-wider uppercase">Tim Kelompok 3 Technopreneurship UNIMED 2026</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-12 px-4 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-16 md:py-24 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-950 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 lg:gap-24">
            {/* Logo and About */}
            <div className="md:col-span-6 space-y-6">
              <div className="flex items-center">
                <LogoIcon 
                  className="w-44 h-16 md:w-56 md:h-20 bg-slate-900 dark:bg-primary rounded-xl shadow-lg shadow-slate-900/10 dark:shadow-primary/20" 
                  textClassName="text-white font-black text-lg w-10 h-10 bg-slate-900 dark:bg-primary rounded-xl flex items-center justify-center"
                />
              </div>
              <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed max-w-md">
                Next-generation financial tracker untuk mahasiswa produktif. Tap, track, dan kuasai keuanganmu dalam hitungan detik. Kelola budget harianmu dengan gaya.
              </p>
            </div>

            {/* Quick Links */}
            <div className="md:col-span-6 grid grid-cols-2 sm:grid-cols-3 gap-8">
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Product</h4>
                <div className="flex flex-col gap-4">
                  <Link to="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">Tracking</Link>
                  <Link to="/shop" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">Shop</Link>
                  <Link to="/music" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">Music Hub</Link>
                </div>
              </div>
              <div className="space-y-6">
                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">Quick Links</h4>
                <div className="flex flex-col gap-4">
                  <Link to="/games" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">Mini Games</Link>
                  <Link to="/ar" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">Panduan</Link>
                  <Link to="/admin" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">Admin Panel</Link>
                  <Link to="/feedback" className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">Hubungi Dev</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 pt-8 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600">
              © 2026 Technopreneurship UNIMED // KELOMPOK 3
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
