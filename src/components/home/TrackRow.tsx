"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
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
}

export const TrackRow: React.FC<TrackRowProps> = ({ track, currency, queue }) => {
    const t = useTranslations('App');
    const locale = useLocale();
    const pathname = usePathname();
    const router = useRouter();
    const { user, purchasedTrackIds = [] } = useAuth();
    const { currentTrack, isPlaying, playTrack, togglePlay, progress, duration, loadingTrackId } = useAudio();
    const { addItem } = useCart();
    const { isFavorite, toggleFavorite } = useFavorites();
    const isActive = currentTrack?.id === track.id;
    const isLoading = loadingTrackId === track.id;
    const fav = isFavorite(track.id);
    const isPurchased = React.useMemo(() => {
        if (!purchasedTrackIds || purchasedTrackIds.length === 0) return false;
        const targetId = String(track.id);
        return purchasedTrackIds.some(pid => String(pid) === targetId);
    }, [purchasedTrackIds, track.id]);

    // Log for checking purchase status
    React.useEffect(() => {
        if (user && purchasedTrackIds.length > 0) {
            if (isPurchased) {
                console.log(`TrackRow: Track ${track.id} (${track.title}) is PURCHASED!`);
            }
        }
    }, [user, purchasedTrackIds, isPurchased, track.id, track.title]);

    const requireLogin = (action: () => void, message: string) => {
        if (!user) {
            toast.info(message);
            router.push(`/login?returnUrl=${encodeURIComponent(pathname)}`);
            return;
        }
        action();
    };

    // Misafir kullanıcılar da müzik dinleyebilsin; diğer aksiyonlar hâlâ login ister
    const handlePlay = () => {
        if (isLoading) return; // Prevent clicking while loading
        if (isActive) {
            togglePlay();
        } else {
            playTrack(track, queue && queue.length > 0 ? queue : undefined);
        }
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
        <div className={`group flex flex-col lg:flex-row items-start lg:items-center gap-3 lg:gap-4 px-4 lg:px-10 py-4 lg:py-5 transition-all border-b border-app-border hover:bg-app-surface ${isActive ? 'bg-app-surface' : ''}`}>
            {/* ÜST SATIR: Play + Başlık/Artist */}
            <div className="w-12 flex-shrink-0">
                <button
                    onClick={handlePlay}
                    disabled={isLoading}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isLoading
                        ? 'bg-app-surface text-app-text-muted cursor-wait'
                        : isActive && isPlaying
                            ? 'bg-app-primary text-app-primary-foreground scale-110 shadow-lg shadow-app-primary/20'
                            : 'bg-app-surface text-app-text hover:bg-app-primary hover:text-app-primary-foreground group-hover:scale-105'
                        }`}>
                    {isLoading ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    ) : isActive && isPlaying ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                    ) : (
                        <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                    )}
                </button>
            </div>

            {/* Title / Artist - başlık ince font */}
            <div className="flex-1 min-w-0 pr-0 lg:pr-8 mt-1 lg:mt-0">
                <h4 className={`text-sm font-medium uppercase tracking-tight truncate transition-colors ${isActive ? 'text-app-primary' : 'text-app-text'}`}>
                    {track.title}
                </h4>
                <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-[0.15em] leading-none mt-1">
                    {track.artist_name || 'Unknown Artist'}
                </p>
            </div>

            {/* ORTA SATIR: Genre + BPM pill'leri (mobil) */}
            <div className="w-full flex items-center gap-2 mt-2 lg:hidden">
                <span className="px-3 py-1 bg-app-surface border border-app-border rounded-lg text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                    {(locale === 'en' ? (track.genres?.name_en || track.genres?.name) : track.genres?.name) || 'Vocal'}
                </span>
                <span className="px-2 py-1 rounded-lg bg-app-surface text-[10px] font-black text-app-text uppercase tracking-widest">
                    {track.bpm || '-'} BPM
                </span>
            </div>

            {/* Masaüstü için ayrı Genre sütunu */}
            <div className="hidden lg:block w-32">
                <span className="px-3 py-1 bg-app-surface border border-app-border rounded-lg text-[10px] font-black text-app-text-muted uppercase tracking-widest">
                    {(locale === 'en' ? (track.genres?.name_en || track.genres?.name) : track.genres?.name) || 'Vocal'}
                </span>
            </div>

            {/* ALT SATIR: Waveform + aksiyonlar */}
            <div className="w-full lg:w-64 px-0 lg:px-8 mt-3 lg:mt-0 overflow-hidden">
                <TrackWaveform
                    url={track.preview_url}
                    isPlaying={isActive && isPlaying}
                    progress={isActive ? progress : undefined}
                    duration={isActive ? duration : undefined}
                    enabled={true}
                />
            </div>

            {/* BPM sütunu sadece desktop'ta */}
            <div className="hidden lg:flex w-20 justify-center items-center">
                <span className="text-xs font-black text-app-text">{track.bpm || '-'}</span>
            </div>

            {/* Favori + Action - Desktop için yeniden yapılandırıldı */}
            <div className="w-full lg:w-48 flex flex-col lg:flex-row items-start lg:items-center gap-3 mt-3 lg:mt-0 lg:pr-4">
                {/* Mobil: Favori solda, fiyat ve butonlar sağda */}
                <div className="w-full lg:hidden flex items-start justify-between gap-3">
                    <button
                        onClick={handleFavorite}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${fav ? 'text-app-primary' : 'text-app-text-muted hover:text-app-primary/80'}`}
                        aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    >
                        <svg className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>

                    {isPurchased ? (
                        <div className="flex-1 flex flex-col items-end gap-2">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                {t('purchased')}
                            </span>
                            <Link
                                href="/library"
                                className="w-full px-4 py-2 rounded-xl bg-emerald-500 text-[10px] font-black text-white uppercase tracking-widest hover:bg-emerald-600 transition-all text-center flex items-center justify-center gap-2"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                {t('goToLibrary')}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-end gap-2">
                            <span className="text-sm font-black text-[#3b82f6] uppercase tracking-wider">
                                {formatPrice(track.price, currency)}
                            </span>
                            <div className="flex flex-col w-full gap-2">
                                <button
                                    onClick={handleAddToCart}
                                    className="w-full px-4 py-2 rounded-xl border border-app-border text-[10px] font-black text-app-text-muted uppercase tracking-widest hover:border-app-primary hover:text-app-primary transition-all bg-app-surface/60"
                                >
                                    {t('addToCartShort')}
                                </button>
                                <button
                                    onClick={handleQuickBuy}
                                    className="w-full px-4 py-2 rounded-xl bg-app-primary text-[10px] font-black text-app-primary-foreground uppercase tracking-widest hover:bg-app-primary/90 transition-all"
                                >
                                    {t('quickBuy')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Desktop: Favori + Fiyat + Butonlar yan yana/alt alta */}
                <div className="hidden lg:flex w-full items-center justify-end gap-3">
                    <button
                        onClick={handleFavorite}
                        className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${fav ? 'text-app-primary' : 'text-app-text-muted hover:text-app-primary/80'}`}
                        aria-label={fav ? 'Favorilerden çıkar' : 'Favorilere ekle'}
                    >
                        <svg className="w-5 h-5" fill={fav ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                    </button>

                    {isPurchased ? (
                        <div className="flex flex-col items-end gap-1.5 min-w-[140px]">
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                                </svg>
                                {t('purchased')}
                            </span>
                            <Link
                                href="/library"
                                className="w-full px-4 py-1.5 rounded-xl bg-emerald-500 text-[10px] font-black text-white uppercase tracking-widest hover:bg-emerald-600 transition-all text-center flex items-center justify-center gap-2"
                            >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                </svg>
                                {t('goToLibrary')}
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col items-end gap-2">
                            <span className="text-sm font-black text-[#3b82f6] uppercase tracking-wider">
                                {formatPrice(track.price, currency)}
                            </span>
                            <div className="flex flex-col gap-1.5">
                                <button
                                    onClick={handleAddToCart}
                                    className="px-4 py-1.5 rounded-xl border border-app-border text-[10px] font-black text-app-text-muted uppercase tracking-widest hover:border-app-primary hover:text-app-primary transition-all bg-app-surface/60 whitespace-nowrap"
                                >
                                    {t('addToCartShort')}
                                </button>
                                <button
                                    onClick={handleQuickBuy}
                                    className="px-4 py-1.5 rounded-xl bg-app-primary text-[10px] font-black text-app-primary-foreground uppercase tracking-widest hover:bg-app-primary/90 transition-all whitespace-nowrap"
                                >
                                    {t('quickBuy')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
