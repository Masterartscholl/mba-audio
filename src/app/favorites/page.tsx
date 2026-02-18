"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sidebar, SidebarMobileDrawer } from '@/components/home/Sidebar';
import { Header } from '@/components/home/Header';
import { GlobalPlayer } from '@/components/home/GlobalPlayer';
import { useFavorites } from '@/context/FavoritesContext';
import { TrackRow } from '@/components/home/TrackRow';

export default function FavoritesPage() {
    const t = useTranslations('App');
    const { favorites } = useFavorites();
    const [currency, setCurrency] = useState('TL');
    const [filters, setFilters] = useState<any>({});
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const closeMobileSidebar = React.useCallback(() => setIsMobileSidebarOpen(false), []);

    // Filter out deleted/unpublished tracks
    const publishedFavorites = useMemo(() => {
        return favorites.filter(track =>
            !track.status || track.status === 'published'
        );
    }, [favorites]);

    // Apply filters to favorites
    const filteredFavorites = useMemo(() => {
        let result = publishedFavorites;

        // Category filter
        const catId = filters.categoryId != null && filters.categoryId !== '' ? Number(filters.categoryId) : null;
        if (catId != null) {
            result = result.filter(track => track.category_id === catId);
        }

        // Genre filter - Note: Favorites may not have genre_id, skip if not available
        if (filters.genres?.length > 0) {
            result = result.filter(track => {
                // Favorites might not have genre_id field, so we skip genre filtering
                return true;
            });
        }

        // Mode filter
        if (filters.modeId) {
            result = result.filter(track => track.mode_id === filters.modeId);
        }

        // BPM filter
        if (filters.bpmRange?.length === 2) {
            result = result.filter(track => {
                const bpm = Number(track.bpm);
                return bpm >= filters.bpmRange[0] && bpm <= filters.bpmRange[1];
            });
        }

        // Price filter
        if (filters.priceRange?.length === 2) {
            result = result.filter(track => {
                const price = Number(track.price);
                return price >= filters.priceRange[0] && price <= filters.priceRange[1];
            });
        }

        return result;
    }, [publishedFavorites, filters]);

    return (
        <div className="flex flex-col min-h-screen lg:flex-row lg:h-screen lg:overflow-hidden bg-app-bg selection:bg-[#3b82f6]/30">
            <Sidebar filters={filters} onFilterChange={setFilters} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="px-4 lg:px-10 py-6 lg:py-10 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl lg:text-4xl font-black text-app-text tracking-tighter uppercase leading-none">{t('favoritesTitle')}</h2>
                                <p className="text-[#64748b] text-xs lg:text-sm font-bold mt-3 lg:mt-4 uppercase tracking-widest">
                                    {filteredFavorites.length} {t('tracksCount')}
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
                            {filteredFavorites.length > 0 ? (
                                filteredFavorites.map(track => (
                                    <TrackRow key={track.id} track={track} currency={currency} queue={filteredFavorites} />
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

            {/* Mobile Sidebar Drawer */}
            {isMobileSidebarOpen && (
                <div className="fixed inset-0 z-[120] lg:hidden">
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setIsMobileSidebarOpen(false);
                            }
                        }}
                        aria-label="Close menu"
                    />
                    <div className="absolute left-0 top-0 h-full w-full max-w-sm sm:w-4/5 sm:max-w-xs bg-app-bg shadow-2xl border-r border-app-border">
                        <SidebarMobileDrawer
                            filters={filters}
                            onFilterChange={setFilters}
                            onClose={closeMobileSidebar}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
