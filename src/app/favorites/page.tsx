"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sidebar } from '@/components/home/Sidebar';
import { Header } from '@/components/home/Header';
import { GlobalPlayer } from '@/components/home/GlobalPlayer';
import { useFavorites } from '@/context/FavoritesContext';
import { TrackRow } from '@/components/home/TrackRow';

export default function FavoritesPage() {
    const t = useTranslations('App');
    const { favorites } = useFavorites();
    const [currency, setCurrency] = useState('TL');

    // Filter out deleted/unpublished tracks
    const publishedFavorites = useMemo(() => {
        return favorites.filter(track =>
            !track.status || track.status === 'published'
        );
    }, [favorites]);

    return (
        <div className="flex flex-col min-h-screen lg:flex-row lg:h-screen lg:overflow-hidden bg-app-bg selection:bg-[#3b82f6]/30">
            <Sidebar filters={{}} onFilterChange={() => { }} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="px-4 lg:px-10 py-6 lg:py-10 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('favoritesTitle')}</h2>
                                <p className="text-[#64748b] text-xs lg:text-sm font-bold mt-3 lg:mt-4 uppercase tracking-widest">
                                    {publishedFavorites.length} {t('tracksCount')}
                                </p>
                            </div>
                        </div>

                        <div className="hidden lg:flex px-10 py-4 text-[11px] font-black text-[#64748b] uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                            <div className="w-12 flex-shrink-0"></div>
                            <div className="flex-1 min-w-0 pr-8">{t('titleArtist')}</div>
                            <div className="w-32">{t('genre')}</div>
                            <div className="w-64 px-8">{t('waveform')}</div>
                            <div className="w-20 text-center">BPM</div>
                            <div className="w-48 text-right pr-4">{t('action')}</div>
                        </div>

                        <div className="flex-1">
                            {publishedFavorites.length > 0 ? (
                                publishedFavorites.map(track => (
                                    <TrackRow key={track.id} track={track} currency={currency} queue={publishedFavorites} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-[#64748b]">
                                    <svg className="w-16 h-16 opacity-10 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                    <p className="font-black uppercase tracking-[0.2em]">{t('noFavorites')}</p>
                                    <p className="text-xs mt-2 font-bold">{t('noFavoritesHint')}</p>
                                    <Link href="/" className="mt-6 px-6 py-3 bg-[#ede066] text-[#0b1121] text-sm font-black uppercase tracking-widest rounded-xl hover:bg-[#f5e85c] transition-all">
                                        {t('browseTracksLink')}
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="h-32 shrink-0" />
                    </div>
                </main>
            </div>
            <GlobalPlayer />
        </div>
    );
}
