"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { useAudio } from '@/context/AudioContext';
import { useFavorites } from '@/context/FavoritesContext';
import { TrackWaveform } from './TrackWaveform';

interface LibraryTrackRowProps {
    track: any;
}

export const LibraryTrackRow: React.FC<LibraryTrackRowProps> = ({ track }) => {
    const t = useTranslations('App');
    const { currentTrack, isPlaying, playTrack, togglePlay, progress, duration } = useAudio();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isActive = currentTrack?.id === track.id;
    const fav = isFavorite(track.id);

    const handleDownload = async (format: 'wav' | 'mp3') => {
        try {
            const res = await fetch(`/api/download/${track.id}?format=${format}`);
            if (!res.ok) {
                console.error('Download failed', await res.text());
                return;
            }

            const data = await res.json();
            if (!data?.signedUrl) {
                console.error('Signed URL missing in response');
                return;
            }

            // Supabase signed URL'i cross-origin olduğu için birçok tarayıcı
            // download attribute'unu yok sayıp yeni sekmede oynatıyor.
            // Bunu engellemek için dosyayı Blob olarak indirip kendi blob URL'mizle indiriyoruz.
            const fileResponse = await fetch(data.signedUrl as string);
            if (!fileResponse.ok) {
                console.error('Blob download failed');
                return;
            }

            const blob = await fileResponse.blob();
            const objectUrl = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = objectUrl;
            // Dosya adı: eser adı + format (tarayıcı destekliyorsa)
            const safeTitle = (track.title || 'track').toString().replace(/[^\w\-ğüşöçıİĞÜŞÖÇ ]+/g, '');
            link.download = `${safeTitle || 'track'}.${format}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(objectUrl);
        } catch (err) {
            console.error('Download error', err);
        }
    };

    return (
        <div className={`group flex items-center px-10 py-5 transition-all border-b border-app-border hover:bg-app-surface ${isActive ? 'bg-app-surface' : ''}`}>
            <div className="w-12 flex-shrink-0">
                <button
                    onClick={() => isActive ? togglePlay() : playTrack(track)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive && isPlaying
                        ? 'bg-app-primary text-app-primary-foreground scale-110 shadow-lg shadow-[#ede066]/20'
                        : 'bg-app-surface text-app-text hover:bg-app-primary hover:text-[#0b1121] group-hover:scale-105'
                    }`}>
                    {isActive && isPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>
            </div>

            <div className="flex-1 min-w-0 pr-8">
                <h4 className={`text-sm font-medium uppercase tracking-tight truncate ${isActive ? 'text-app-primary' : 'text-app-text'}`}>
                    {track.title}
                </h4>
                <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-[0.15em] leading-none mt-1">
                    {track.artist_name || 'Unknown Artist'}
                </p>
            </div>

            <div className="w-32">
                <span className="px-3 py-1 bg-app-surface border border-app-border rounded-lg text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                    {track.genres?.name || track.genre?.name || 'Vocal'}
                </span>
            </div>

            <div className="w-64 px-8 overflow-hidden">
                <TrackWaveform
                    url={track.preview_url}
                    isPlaying={isActive && isPlaying}
                    progress={isActive ? progress : undefined}
                    duration={isActive ? duration : undefined}
                />
            </div>

            <div className="w-20 text-center">
                <span className="text-xs font-black text-app-text">{track.bpm || '-'}</span>
            </div>

            <div className="w-48 flex items-center justify-end gap-2">
                <button
                    onClick={() => toggleFavorite(track)}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${fav ? 'text-app-primary' : 'text-app-text-muted hover:text-app-primary/80'}`}
                    aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                    <svg className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </button>
                <button
                    onClick={() => handleDownload('wav')}
                    className="px-4 py-2.5 bg-[#ede066]/10 border border-app-primary/30 rounded-xl text-[11px] font-black text-app-primary uppercase tracking-widest hover:bg-[#ede066] hover:text-[#0b1121] transition-all active:scale-95"
                >
                    {t('downloadWav')}
                </button>
                <button
                    onClick={() => handleDownload('mp3')}
                    className="px-4 py-2.5 bg-app-surface border border-app-border rounded-xl text-[11px] font-black text-app-text uppercase tracking-widest hover:bg-app-card transition-all active:scale-95"
                >
                    {t('downloadMp3')}
                </button>
            </div>
        </div>
    );
};
