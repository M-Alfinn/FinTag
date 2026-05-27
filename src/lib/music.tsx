import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

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

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export function MusicProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Synchronize songs with Firebase Firestore (ONLY Firestore songs, no hardcoded local songs)
  useEffect(() => {
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
      setSongs(dbSongs);
    }, (error) => {
      console.error("Error loading songs from Firestore in MusicProvider:", error);
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
