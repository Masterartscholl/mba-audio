"use client";

import React, { createContext, useContext, useState, useRef, useEffect, useCallback } from 'react';

export interface Track {
    id: string | number;
    title: string;
    artist_name: string;
    preview_url: string;
    image_url?: string;
    amount?: number;
    currency?: string;
}

export type RepeatMode = 'off' | 'one' | 'all';

interface AudioContextType {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    progress: number;
    duration: number;
    queue: Track[];
    currentIndex: number;
    repeatMode: RepeatMode;
    playTrack: (track: Track, queue?: Track[]) => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
    seek: (time: number) => void;
    nextTrack: () => void;
    previousTrack: () => void;
    cycleRepeat: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(0.8);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [queue, setQueue] = useState<Track[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');

    const audioRef = useRef<HTMLAudioElement | null>(null);
    const queueRef = useRef<Track[]>([]);
    const currentIndexRef = useRef(0);
    const repeatModeRef = useRef<RepeatMode>('off');

    const playTrackAt = useCallback((track: Track) => {
        setCurrentTrack(track);
        if (audioRef.current) {
            audioRef.current.src = track.preview_url;
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
            setIsPlaying(true);
        }
    }, []);

    queueRef.current = queue;
    currentIndexRef.current = currentIndex;
    repeatModeRef.current = repeatMode;

    useEffect(() => {
        if (!audioRef.current) {
            audioRef.current = new Audio();
        }

        const audio = audioRef.current;

        const handleTimeUpdate = () => setProgress(audio.currentTime);
        const handleDurationChange = () => setDuration(audio.duration);

        // Çalarken waveform/progress bar için daha akıcı güncelleme (timeupdate ~250ms'de bir gelir)
        let rafId: number;
        const tick = () => {
            if (audioRef.current && !audioRef.current.paused) {
                setProgress(audioRef.current.currentTime);
            }
            rafId = requestAnimationFrame(tick);
        };
        const onPlay = () => { rafId = requestAnimationFrame(tick); };
        const onPauseOrEnd = () => cancelAnimationFrame(rafId);
        audio.addEventListener('play', onPlay);
        audio.addEventListener('pause', onPauseOrEnd);
        audio.addEventListener('ended', onPauseOrEnd);

        const handleEnded = () => {
            const mode = repeatModeRef.current;
            const q = queueRef.current;
            const idx = currentIndexRef.current;

            if (mode === 'one') {
                if (audioRef.current) {
                    audioRef.current.currentTime = 0;
                    audioRef.current.play().catch(() => {});
                }
                return;
            }
            if (q.length === 0) {
                setIsPlaying(false);
                return;
            }
            if (mode === 'all' && idx >= q.length - 1) {
                setCurrentIndex(0);
                playTrackAt(q[0]);
                return;
            }
            if (idx < q.length - 1) {
                const nextIdx = idx + 1;
                setCurrentIndex(nextIdx);
                playTrackAt(q[nextIdx]);
                return;
            }
            setIsPlaying(false);
        };

        audio.addEventListener('timeupdate', handleTimeUpdate);
        audio.addEventListener('durationchange', handleDurationChange);
        audio.addEventListener('ended', handleEnded);

        return () => {
            cancelAnimationFrame(rafId);
            audio.removeEventListener('timeupdate', handleTimeUpdate);
            audio.removeEventListener('durationchange', handleDurationChange);
            audio.removeEventListener('ended', handleEnded);
            audio.removeEventListener('play', onPlay);
            audio.removeEventListener('pause', onPauseOrEnd);
            audio.removeEventListener('ended', onPauseOrEnd);
        };
    }, [playTrackAt]);

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = volume;
        }
    }, [volume]);

    const playTrack = useCallback((track: Track, optionalQueue?: Track[]) => {
        const list = optionalQueue && optionalQueue.length > 0 ? optionalQueue : [track];
        const idx = list.findIndex((t) => t.id === track.id);
        const index = idx >= 0 ? idx : 0;
        setQueue(list);
        setCurrentIndex(index);
        playTrackAt(list[index] ?? track);
    }, [playTrackAt]);

    const togglePlay = useCallback(() => {
        if (!currentTrack || !audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play().catch(() => {});
        }
        setIsPlaying(!isPlaying);
    }, [currentTrack, isPlaying]);

    const seek = useCallback((time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setProgress(time);
        }
    }, []);

    const nextTrack = useCallback(() => {
        if (queue.length === 0) return;
        const nextIdx = repeatMode === 'all' && currentIndex >= queue.length - 1
            ? 0
            : Math.min(currentIndex + 1, queue.length - 1);
        if (nextIdx !== currentIndex) {
            setCurrentIndex(nextIdx);
            playTrackAt(queue[nextIdx]);
        } else if (currentIndex === queue.length - 1 && repeatMode === 'all') {
            setCurrentIndex(0);
            playTrackAt(queue[0]);
        } else {
            seek(0);
            if (audioRef.current) audioRef.current.play().catch(() => {});
        }
    }, [queue, currentIndex, repeatMode, playTrackAt, seek]);

    const previousTrack = useCallback(() => {
        if (!audioRef.current) return;
        if (progress > 3) {
            seek(0);
            return;
        }
        if (queue.length === 0) return;
        const prevIdx = repeatMode === 'all' && currentIndex <= 0
            ? queue.length - 1
            : Math.max(currentIndex - 1, 0);
        setCurrentIndex(prevIdx);
        playTrackAt(queue[prevIdx]);
    }, [queue, currentIndex, progress, repeatMode, playTrackAt, seek]);

    const cycleRepeat = useCallback(() => {
        setRepeatMode((m) => (m === 'off' ? 'all' : m === 'all' ? 'one' : 'off'));
    }, []);

    return (
        <AudioContext.Provider value={{
            currentTrack,
            isPlaying,
            volume,
            progress,
            duration,
            queue,
            currentIndex,
            repeatMode,
            playTrack,
            togglePlay,
            setVolume,
            seek,
            nextTrack,
            previousTrack,
            cycleRepeat
        }}>
            {children}
        </AudioContext.Provider>
    );
};

export const useAudio = () => {
    const context = useContext(AudioContext);
    if (context === undefined) {
        throw new Error('useAudio must be used within an AudioProvider');
    }
    return context;
};
