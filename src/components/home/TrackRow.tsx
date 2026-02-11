"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useAudio } from '@/context/AudioContext';
import { useCart } from '@/context/CartContext';
import { useFavorites } from '@/context/FavoritesContext';
import { TrackWaveform } from './TrackWaveform';
import { formatPrice } from '@/utils/format';

interface TrackRowProps {
    track: any;
    currency: string;
    queue?: any[];
    purchasedTrackIds?: number[];
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, currency, queue, purchasedTrackIds = [] }) => {
    const t = useTranslations('App');
    const pathname = usePathname();
    const router = useRouter();
    const { user } = useAuth();
    const { currentTrack, isPlaying, playTrack, togglePlay, progress, duration } = useAudio();
    const { addItem } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isActive = currentTrack?.id === track.id;
    const fav = isFavorite(track.id);
    const isPurchased = purchasedTrackIds.includes(Number(track.id));

    const requireLogin = (action: () => void, message: string) => {
        if (!user) {
            toast.info(message);
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }
        action();
    };

    const handlePlay = () => {
        requireLogin(() => {
            if (isActive) togglePlay();
            else playTrack(track, queue && queue.length > 0 ? queue : undefined);
        }, t('loginRequiredToPlay'));
    };

    const addCurrentTrackToCart = () => {
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

    const handleAddToCart = (e: React.MouseEvent) => {
        e.preventDefault();
        requireLogin(() => {
            addCurrentTrackToCart();
            toast.success(t('addedToCartShort'));
        }, t('loginRequiredToAddCart'));
    };

    const handleQuickBuy = (e: React.MouseEvent) => {
        e.preventDefault();
        requireLogin(() => {
            addCurrentTrackToCart();
            router.push('/checkout');
        }, t('loginRequiredToAddCart'));
    };

    const handleFavorite = () => {
        requireLogin(() => toggleFavorite(track), t('loginRequiredToFavorite'));
    };

    return (
        <div className={`group flex items-center px-10 py-5 transition-all border-b border-app-border hover:bg-app-surface ${isActive ? 'bg-app-surface' : ''}`}>
            {/* Play / Pause: aynı parçadaysa listeden de durdurabilirsin */}
            <div className="w-12 flex-shrink-0">
                <button
                    onClick={handlePlay}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive && isPlaying
                        ? 'bg-app-primary text-app-primary-foreground scale-110 shadow-lg shadow-app-primary/20'
                        : 'bg-app-surface text-app-text hover:bg-app-primary hover:text-app-primary-foreground group-hover:scale-105'
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
                <h4 className={`text-sm font-medium uppercase tracking-tight truncate transition-colors ${isActive ? 'text-app-primary' : 'text-app-text'}`}>
                    {track.title}
                </h4>
                <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-[0.15em] leading-none mt-1">
                    {track.artist_name || 'Unknown Artist'}
                </p>
            </div>

            {/* Genre */}
            <div className="w-32">
                <span className="px-3 py-1 bg-app-surface border border-app-border rounded-lg text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                    {track.genres?.name || track.genre?.name || 'Vocal'}
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
                <span className="text-xs font-black text-app-text">{track.bpm || '-'}</span>
            </div>

            {/* Favori + Action */}
            <div className="w-52 flex items-center justify-end gap-3">
                <button
                    onClick={handleFavorite}
                    className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${fav ? 'text-app-primary' : 'text-app-text-muted hover:text-app-primary/80'}`}
                    aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                >
                    <svg className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </button>
                {isPurchased ? (
                    <span className="flex flex-col items-end gap-1 text-[11px] font-black text-app-text-muted uppercase tracking-widest">
                        <span className="text-xs">{t('purchased')}</span>
                        <Link href="/library" className="text-app-primary hover:underline text-[10px]">
                            {t('downloadInLibrary')}
                        </Link>
                    </span>
                ) : (
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[11px] font-black text-[#3b82f6] uppercase tracking-widest">
                            {formatPrice(track.price, currency)}
                        </span>
                        <div className="flex gap-1">
                            <button
                                onClick={handleAddToCart}
                                className="px-3 py-1.5 rounded-lg border border-app-border text-[10px] font-black text-app-text-muted uppercase tracking-widest hover:border-app-primary hover:text-app-primary transition-all bg-app-surface/60"
                            >
                                {t('addToCartShort')}
                            </button>
                            <button
                                onClick={handleQuickBuy}
                                className="px-3 py-1.5 rounded-lg bg-app-primary text-[10px] font-black text-app-primary-foreground uppercase tracking-widest hover:bg-app-primary/90 transition-all"
                            >
                                {t('quickBuy')}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
