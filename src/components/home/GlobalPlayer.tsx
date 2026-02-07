"use client";

import React, { useState } from 'react';
import { useAudio } from '@/context/AudioContext';
import { useFavorites } from '@/context/FavoritesContext';

export const GlobalPlayer: React.FC = () => {
    const {
        currentTrack,
        isPlaying,
        togglePlay,
        progress,
        duration,
        seek,
        volume,
        setVolume,
        previousTrack,
        nextTrack,
        cycleRepeat,
        repeatMode,
        queue
    } = useAudio();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [showQueue, setShowQueue] = useState(false);

    if (!currentTrack) return null;

    const formatTime = (time: number) => {
        if (!Number.isFinite(time) || time < 0) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleFavorite = () => {
        toggleFavorite({
            id: currentTrack.id,
            title: currentTrack.title,
            artist_name: currentTrack.artist_name ?? 'Unknown Artist',
            preview_url: currentTrack.preview_url,
            image_url: currentTrack.image_url
        });
    };

    const fav = isFavorite(currentTrack.id);

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0b1121]/90 backdrop-blur-xl border-t border-white/5 h-24 z-[100] px-8 flex items-center justify-between animate-in slide-in-from-bottom duration-500">
            {/* Track Info */}
            <div className="flex items-center gap-4 w-1/4">
                <div className="w-14 h-14 rounded-xl bg-[#1e293b] overflow-hidden shadow-2xl flex-shrink-0">
                    <img
                        src={currentTrack.image_url || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=300&h=300&fit=crop"}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="min-w-0">
                    <h4 className="text-white font-black text-sm uppercase truncate tracking-tight">{currentTrack.title}</h4>
                    <p className="text-[#64748b] text-[10px] font-bold uppercase truncate tracking-widest leading-none mt-1">{currentTrack.artist_name || 'Unknown Artist'}</p>
                </div>
                <button
                    onClick={handleFavorite}
                    className={`ml-2 transition-colors ${fav ? 'text-[#ede066]' : 'text-[#64748b] hover:text-[#ede066]'}`}
                    aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                    <svg className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-2xl px-12">
                <div className="flex items-center gap-8">
                    <button
                        onClick={() => setShowQueue((q) => !q)}
                        className={`transition-colors ${showQueue ? 'text-[#ede066]' : 'text-[#64748b] hover:text-white'}`}
                        aria-label="Kuyruk"
                        title="Kuyruk"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
                    </button>
                    <button
                        onClick={previousTrack}
                        className="text-white hover:text-[#ede066] transition-colors"
                        aria-label="Önceki parça"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" /></svg>
                    </button>
                    <button
                        onClick={togglePlay}
                        className="w-12 h-12 rounded-full bg-[#ede066] flex items-center justify-center text-[#0b1121] transition-transform active:scale-90 hover:scale-105 shadow-xl shadow-[#ede066]/20"
                        aria-label={isPlaying ? 'Duraklat' : 'Oynat'}
                    >
                        {isPlaying ? (
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                        ) : (
                            <svg className="w-6 h-6 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        )}
                    </button>
                    <button
                        onClick={nextTrack}
                        className="text-white hover:text-[#ede066] transition-colors"
                        aria-label="Sonraki parça"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" /></svg>
                    </button>
                    <button
                        onClick={cycleRepeat}
                        className={`relative transition-colors ${repeatMode !== 'off' ? 'text-[#ede066]' : 'text-[#64748b] hover:text-white'}`}
                        aria-label={`Tekrar: ${repeatMode === 'one' ? 'Parça' : repeatMode === 'all' ? 'Tümü' : 'Kapalı'}`}
                        title={repeatMode === 'off' ? 'Tekrarla (kapalı)' : repeatMode === 'one' ? 'Tek parça' : 'Tüm kuyruk'}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {repeatMode === 'one' && (
                            <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-black bg-[#ede066] text-[#0b1121] rounded-full w-3 h-3 flex items-center justify-center leading-none">1</span>
                        )}
                    </button>
                </div>

                <div className="w-full flex items-center gap-3">
                    <span className="text-[10px] font-black text-[#64748b] w-10 text-right">{formatTime(progress)}</span>
                    <div className="group relative flex-1 h-6 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max={duration && duration > 0 ? duration : 100}
                            step="0.1"
                            value={progress}
                            onChange={(e) => seek(Number(e.target.value))}
                            className="absolute inset-0 w-full h-1.5 bg-[#1e293b] rounded-full appearance-none cursor-pointer accent-[#ede066] z-10"
                            style={{
                                background: `linear-gradient(to right, #ede066 ${(progress / (duration && duration > 0 ? duration : 1)) * 100}%, #1e293b ${(progress / (duration && duration > 0 ? duration : 1)) * 100}%)`
                            }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-[#64748b] w-10">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Volume & Fullscreen */}
            <div className="flex items-center gap-6 justify-end w-1/4">
                <button
                    onClick={() => setShowQueue((q) => !q)}
                    className={`lg:hidden transition-colors ${showQueue ? 'text-[#ede066]' : 'text-[#64748b] hover:text-white'}`}
                    aria-label="Kuyruk"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" /></svg>
                </button>
                <div className="flex items-center gap-3 group">
                    <svg className="w-5 h-5 text-[#64748b] group-hover:text-white transition-colors shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="w-24 h-1.5 bg-[#1e293b] rounded-full appearance-none cursor-pointer accent-[#ede066]"
                        aria-label="Ses düzeyi"
                    />
                </div>
                <button
                    onClick={() => document.documentElement.requestFullscreen?.()}
                    className="text-[#64748b] hover:text-white transition-colors hidden sm:block"
                    aria-label="Tam ekran"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5-5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                </button>
            </div>

            {/* Queue popover */}
            {showQueue && queue.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-80 max-h-64 overflow-y-auto custom-scrollbar bg-[#131b2e] border border-white/10 rounded-xl shadow-2xl z-[101] p-2">
                    <p className="text-[10px] font-black text-[#64748b] uppercase tracking-widest px-2 py-1 sticky top-0 bg-[#131b2e]">Kuyruk ({queue.length})</p>
                    {queue.map((t, i) => (
                        <div
                            key={t.id}
                            className={`px-3 py-2 rounded-lg text-left text-sm ${currentTrack?.id === t.id ? 'bg-[#ede066]/20 text-[#ede066]' : 'text-white hover:bg-white/5'}`}
                        >
                            <span className="font-bold truncate block">{t.title}</span>
                            <span className="text-[10px] text-[#64748b]">{t.artist_name || 'Unknown'}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
