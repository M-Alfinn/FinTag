import { motion } from 'motion/react';
import { 
  Play, Pause, SkipForward, SkipBack, 
  Music 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useMusic } from '../lib/music';

export default function MusicPlayer() {
  const {
    songs,
    currentIndex,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    currentSong,
    handleNext,
    handleBack,
    togglePlay,
    playSong,
    seek
  } = useMusic();

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const clickedValue = (x / rect.width) * duration;
    seek(clickedValue);
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (songs.length === 0 || !currentSong) {
    return (
      <div className="max-w-md mx-auto text-center py-24 space-y-6 animate-fadeIn">
        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-[40px] flex items-center justify-center mx-auto shadow-sm">
          <Music className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-heading font-bold dark:text-white">Playlist Kosong</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
            Belum ada lagu dalam daftar putar saat ini. Musik dapat ditambahkan, dihapus, dan dikelola secara mudah oleh administrator melalui halaman <strong>Admin Dashboard</strong>.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch pt-4">
        
        {/* Left: Player Artwork - Bento Style */}
        <div className="w-full lg:w-5/12 space-y-6">
          <motion.div 
            key={currentSong.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bento-card p-6 border-white/50 flex flex-col justify-between overflow-hidden group"
          >
            <div className="relative aspect-square w-full rounded-[32px] overflow-hidden shadow-2xl bg-slate-100 dark:bg-slate-950">
              {/* Blurred background for non-square covers */}
              <img 
                 src={currentSong.cover} 
                 referrerPolicy="no-referrer"
                 className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-110 pointer-events-none"
                 alt=""
                 onError={(e) => (e.currentTarget.style.display = 'none')}
              />
              <img 
                 src={currentSong.cover} 
                 referrerPolicy="no-referrer"
                 className={cn(
                   "relative w-full h-full object-contain z-10 transition-all duration-1000",
                   isPlaying ? "scale-102" : "scale-100 grayscale-[0.2]"
                 )}
                 alt="Cover"
                 onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400')}
              />
              {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20 backdrop-blur-[2px] z-20">
                      <div className="flex items-end gap-1.5 px-4 h-12">
                          {[0.1, 0.3, 0.2, 0.4, 0.1].map((delay, i) => (
                              <motion.div 
                                  key={i}
                                  animate={{ height: [10, 40, 20, 48, 10] }}
                                  transition={{ repeat: Infinity, duration: 0.8, delay: delay }}
                                  className="w-1.5 bg-primary rounded-full"
                              />
                          ))}
                      </div>
                  </div>
              )}
            </div>

            <div className="pt-6 flex justify-between items-end">
              <div className="space-y-1 text-left">
                <p className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] leading-none mb-1">Now Playing</p>
                <h2 className="text-2xl font-heading font-bold text-slate-900 dark:text-white tracking-tight leading-none">{currentSong.title}</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest leading-none mt-1">{currentSong.artist}</p>
              </div>
            </div>
          </motion.div>

          <div className="bento-card p-8 space-y-6">
            <div className="space-y-4">
              <div 
                className="relative w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden cursor-pointer group"
                onClick={handleSeek}
              >
                  <motion.div 
                    className="absolute left-0 top-0 bottom-0 bg-primary shadow-lg shadow-primary/20 z-10"
                    style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
                  />
                  <div className="absolute inset-x-0 top-0 bottom-0 bg-slate-100/50 dark:bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 dark:text-slate-500 font-mono tracking-widest font-bold">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-8">
                <button onClick={handleBack} className="p-2 text-slate-400 dark:text-slate-500 hover:text-secondary dark:hover:text-white transition-all hover:scale-110 active:scale-90 cursor-pointer"><SkipBack className="w-6 h-6 fill-current" /></button>
                <button 
                  onClick={togglePlay}
                  className="w-16 h-16 bg-secondary dark:bg-primary text-white rounded-full flex items-center justify-center shadow-xl shadow-secondary/20 dark:shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  disabled={isBuffering && isPlaying}
                >
                  {isBuffering && isPlaying ? (
                    <motion.div 
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : isPlaying ? (
                    <Pause className="w-6 h-6 fill-current" />
                  ) : (
                    <Play className="w-6 h-6 fill-current ml-1" />
                  )}
                </button>
                <button onClick={handleNext} className="p-2 text-slate-400 dark:text-slate-500 hover:text-secondary dark:hover:text-white transition-all hover:scale-110 active:scale-90 cursor-pointer"><SkipForward className="w-6 h-6 fill-current" /></button>
            </div>
          </div>
        </div>

        {/* Right: Playlist */}
        <div className="flex-1 space-y-6 py-2">
           <div className="flex items-center justify-between px-2">
              <div className="space-y-1 text-left">
                <h3 className="font-heading font-bold text-xl leading-none flex items-center gap-2 dark:text-white">
                    Playlist
                </h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">TRENDING // {songs.length} TRACKS</p>
              </div>
              <Music className="w-5 h-5 text-primary opacity-40" />
           </div>

           <div className="space-y-2 overflow-y-auto max-h-[680px] pr-2 custom-scrollbar lg:grid lg:grid-cols-1 gap-2">
               {songs.map((song, i) => (
                <div
                  key={song.id}
                  onClick={() => playSong(i)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { playSong(i); } }}
                  className={cn(
                    "w-full flex items-center gap-4 p-4 rounded-3xl transition-all group border cursor-pointer",
                    currentIndex === i 
                      ? "bg-secondary dark:bg-primary text-white border-secondary dark:border-primary shadow-lg shadow-secondary/10 dark:shadow-primary/10" 
                      : "bg-white/50 dark:bg-slate-900/40 backdrop-blur-sm text-secondary dark:text-white border-white dark:border-white/5 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-sm"
                  )}
                >
                   <div className="relative w-12 h-12 bg-slate-100 dark:bg-slate-950 rounded-2xl overflow-hidden shrink-0 shadow-sm">
                      <img 
                       src={song.cover} 
                       referrerPolicy="no-referrer"
                       className="w-full h-full object-cover" 
                       onError={(e) => (e.currentTarget.src = 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=200')} 
                     />
                      {currentIndex === i && isPlaying && (
                         <div className="absolute inset-0 bg-primary/40 flex items-center justify-center">
                            <motion.div 
                               animate={{ scale: [1, 1.3, 1] }} 
                               transition={{ repeat: Infinity, duration: 1 }}
                               className="w-2 h-2 bg-white rounded-full shadow-lg"
                            />
                         </div>
                      )}
                   </div>
                   <div className="flex-1 text-left min-w-0">
                      <p className={cn("text-sm font-bold truncate tracking-tight", currentIndex === i ? "text-white" : "text-slate-900 dark:text-white")}>{song.title}</p>
                      <p className={cn("text-[10px] uppercase font-bold tracking-widest opacity-60", currentIndex === i ? "text-white/60" : "text-slate-400 dark:text-slate-500")}>{song.artist}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}
