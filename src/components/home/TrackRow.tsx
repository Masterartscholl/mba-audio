"use client";

import React from 'react';
import { useAudio } from '@/context/AudioContext';
import { TrackWaveform } from './TrackWaveform';
import { formatPrice } from '@/utils/format';

interface TrackRowProps {
    track: any;
    currency: string;
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, currency }) => {
    const { currentTrack, isPlaying, playTrack } = useAudio();
    const isActive = currentTrack?.id === track.id;

    return (
        <div className={`group flex items-center px-10 py-5 transition-all border-b border-white/5 hover:bg-white/[0.02] ${isActive ? 'bg-white/[0.03]' : ''}`}>
            {/* Play Button */}
            <div className="w-12 flex-shrink-0">
                <button
                    onClick={() => playTrack(track)}
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

            {/* Title / Artist */}
            <div className="flex-1 min-w-0 pr-8">
                <h4 className={`text-sm font-black uppercase tracking-tight truncate transition-colors ${isActive ? 'text-[#ede066]' : 'text-white'}`}>
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

            {/* Waveform */}
            <div className="w-64 px-8 overflow-hidden">
                <TrackWaveform url={track.preview_url} isPlaying={isActive && isPlaying} />
            </div>

            {/* BPM */}
            <div className="w-20 text-center">
                <span className="text-xs font-black text-white">{track.bpm || '-'}</span>
            </div>

            {/* Action / Price */}
            <div className="w-32 text-right">
                <button className="px-6 py-2.5 bg-[#3b82f6]/10 border border-[#3b82f6]/30 rounded-xl text-[11px] font-black text-[#3b82f6] uppercase tracking-widest hover:bg-[#3b82f6] hover:text-white transition-all active:scale-95 shadow-sm">
                    {formatPrice(track.price, currency)}
                </button>
            </div>
        </div>
    );
};
