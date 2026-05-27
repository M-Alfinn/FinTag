import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { triggerQuotaExceeded } from './auth';

export interface Song {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
  isCustom?: boolean;
}

interface MusicContextType {
  songs: Song[];
  currentIndex: number;
  isPlaying: boolean;
  isBuffering: boolean;
  currentTime: number;
  duration: number;
  currentSong: Song | null;
  handleNext: () => void;
  handleBack: () => void;
  togglePlay: () => void;
  playSong: (index: number) => void;
  seek: (seconds: number) => void;
}

const FALLBACK_SONGS: Song[] = [
  {
    id: 'fallback-1',
    title: 'Warm Afternoon',
    artist: 'Lofi Ambient',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400',
    isCustom: false
  },
  {
    id: 'fallback-2',
    title: 'Midnight Cozy Coding',
    artist: 'Study Beats',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    cover: 'https://images.unsplash.com/photo-1494232410401-ad00d5433cfa?auto=format&fit=crop&q=80&w=400',
    isCustom: false
  },
  {
    id: 'fallback-3',
    title: 'Rainy Cafe Walk',
    artist: 'Coffee Chill',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    cover: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&q=80&w=400',
    isCustom: false
  }
];

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize songs with Firebase Firestore (with fallback hardcoded and local cache)
  useEffect(() => {
    const cachedSongsKey = 'ganci_cached_songs';
    
    // Instantly preload cache or fallback tracks!
    const cachedData = localStorage.getItem(cachedSongsKey);
    if (cachedData) {
      try {
        setSongs(JSON.parse(cachedData));
      } catch (e) {
        setSongs(FALLBACK_SONGS);
      }
    } else {
      setSongs(FALLBACK_SONGS);
    }

    const q = query(collection(db, 'songs'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dbSongs = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || "Untitled",
        artist: doc.data().artist || "Unknown Artist",
        url: doc.data().url || "",
        cover: doc.data().cover || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&q=80&w=400",
        isCustom: true
      }));
      // If db returned no songs, serve fallbacks
      const activeSongs = dbSongs.length > 0 ? dbSongs : FALLBACK_SONGS;
      setSongs(activeSongs);
      try {
        localStorage.setItem(cachedSongsKey, JSON.stringify(activeSongs));
      } catch (e) {}
    }, (error) => {
      console.error("Error loading songs from Firestore in MusicProvider:", error);
      const errMessage = error instanceof Error ? error.message : String(error);
      const isQuotaError = errMessage.includes('Quota exceeded') || errMessage.includes('Quota limit exceeded') || errMessage.includes('quota');
      if (isQuotaError) {
        triggerQuotaExceeded();
        
        const localSongs = localStorage.getItem(cachedSongsKey);
        if (localSongs) {
          try {
            setSongs(JSON.parse(localSongs));
          } catch (e) {
            setSongs(FALLBACK_SONGS);
          }
        } else {
          setSongs(FALLBACK_SONGS);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const currentSong = songs[currentIndex] || null;

  // React to current track change (re-bind src and load track)
  useEffect(() => {
    if (audioRef.current && currentSong) {
      const wasPlaying = isPlaying;
      audioRef.current.src = currentSong.url;
      audioRef.current.load();
      setIsBuffering(true);
      if (wasPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentIndex, currentSong?.id]); // Use id to avoid unnecessary triggers

  // React to play/pause state change
  useEffect(() => {
    if (audioRef.current && currentSong) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  const handleNext = () => {
    if (songs.length === 0) return;
    setCurrentIndex(prev => (prev + 1) % songs.length);
    setIsPlaying(true);
  };

  const handleBack = () => {
    if (songs.length === 0) return;
    setCurrentIndex(prev => (prev - 1 + songs.length) % songs.length);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (songs.length === 0) return;
    setIsPlaying(prev => !prev);
  };

  const playSong = (index: number) => {
    if (index >= 0 && index < songs.length) {
      setCurrentIndex(index);
      setIsPlaying(true);
    }
  };

  const seek = (seconds: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = seconds;
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const onCanPlay = () => {
    setIsBuffering(false);
  };

  const onWaiting = () => {
    setIsBuffering(true);
  };

  return (
    <MusicContext.Provider value={{
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
    }}>
      {children}
      {currentSong && (
        <audio
          ref={audioRef}
          src={currentSong.url}
          preload="auto"
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onCanPlay={onCanPlay}
          onWaiting={onWaiting}
          onEnded={handleNext}
        />
      )}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  const context = useContext(MusicContext);
  if (context === undefined) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return context;
}
