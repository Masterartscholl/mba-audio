"use client";

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { TrackWaveform } from './TrackWaveform';
import { formatPrice } from '@/utils/format';

interface TrackRowProps {
    track: any;
    currency: string;
    queue?: any[];
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, currency, queue }) => {
    const { currentTrack, isPlaying, playTrack, togglePlay, progress, duration } = useAudio();
    const { addItem } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isActive = currentTrack?.id === track.id;
    const fav = isFavorite(track.id);

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        addItem({
            id: track.id,
            title: track.title,
            artist_name: track.artist_name ?? 'Unknown Artist',
            preview_url: track.preview_url,
            price: track.price,
            currency,
            bpm: track.bpm,
            genres: track.genres
        });
    };

    return (
        <div className={`group flex items-center px-10 py-5 transition-all border-b border-white/5 hover:bg-white/[0.02] ${isActive ? 'bg-white/[0.03]' : ''}`}>
            {/* Play / Pause: aynı parçadaysa listeden de durdurabilirsin */}
            <div className="w-12 flex-shrink-0">
                <button
                    onClick={() => isActive ? togglePlay() : playTrack(track, queue && queue.length > 0 ? queue : undefined)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive && isPlaying
                        ? 'bg-[#ede066] text-[#0b1121] scale-110 shadow-lg shadow-[#ede066]/20'
                        : 'bg-white/5 text-white hover:bg-[#ede066] hover:text-[#0b1121] group-hover:scale-105'
                        }`}>
                    {isActive && isPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>
            </div>

            {/* Title / Artist - başlık ince font */}
            <div className="flex-1 min-w-0 pr-8">
                <h4 className={`text-sm font-medium uppercase tracking-tight truncate transition-colors ${isActive ? 'text-[#ede066]' : 'text-white'}`}>
                    {track.title}
                </h4>
                <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-[0.15em] leading-none mt-1">
                    {track.artist_name || 'Unknown Artist'}
                </p>
            </div>

            {/* Genre */}
            <div className="w-32">
                <span className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-black text-[#64748b] uppercase tracking-widest">
                    {track.genres?.name || 'Vocal'}
                </span>
            </div>

            {/* Waveform - müziğe göre ilerleme rengi (progressColor) */}
            <div className="w-64 px-8 overflow-hidden">
                <TrackWaveform
                    url={track.preview_url}
                    isPlaying={isActive && isPlaying}
                    progress={isActive ? progress : undefined}
                    duration={isActive ? duration : undefined}
                />
            </div>

            {/* BPM */}
            <div className="w-20 text-center">
                <span className="text-xs font-black text-white">{track.bpm || '-'}</span>
            </div>

            {/* Favori + Action */}
            <div className="w-40 flex items-center justify-end gap-2">
                <button
                    onClick={() => toggleFavorite(track)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${fav ? 'text-[#ede066]' : 'text-[#64748b] hover:text-[#ede066]/80'}`}
                    aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                    <svg className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
                <button
                    onClick={handleAddToCart}
                    className="px-5 py-2.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl text-[11px] font-black text-[#3b82f6] uppercase tracking-widest hover:bg-[#3b82f6] hover:text-white transition-all active:scale-95 shadow-sm"
                >
                    {formatPrice(track.price, currency)}
                </button>
            </div>
        </div>
    );
};
