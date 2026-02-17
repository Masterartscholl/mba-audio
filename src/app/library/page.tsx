"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Sidebar, SidebarMobileDrawer } from '@/components/home/Sidebar';
import { Header } from '@/components/home/Header';
import { GlobalPlayer } from '@/components/home/GlobalPlayer';
import { LibraryTrackRow } from '@/components/home/LibraryTrackRow';
import { supabase } from '@/lib/supabase';

export default function LibraryPage() {
    const t = useTranslations('App');
    const [purchasedTracks, setPurchasedTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const closeMobileSidebar = React.useCallback(() => setIsMobileSidebarOpen(false), []);

    useEffect(() => {
        const run = async () => {
            try {
                setLoading(true);
                // Kullanıcının başarılı siparişlerinden ilişkili track'leri getir
                const { data, error } = await supabase
                    .from('orders')
                    .select(`
                        id,
                        amount,
                        created_at,
                        tracks (
                            id,
                            title,
                            artist_name,
                            image_url,
                            preview_url,
                            bpm,
                            categories ( name ),
                            genres ( name )
                        )
                    `)
                    .eq('status', 'success')
                    .order('created_at', { ascending: false });

                if (error) {
                    console.error('Library orders fetch error:', error);
                    setPurchasedTracks([]);
                } else {
                    const list =
                        (data as any[])?.map((o) => {
                            const track = (o as any).tracks;
                            if (!track) return null;
                            return {
                                ...track,
                                order_id: o.id,
                                amount: o.amount,
                                purchased_at: o.created_at,
                            };
                        }).filter(Boolean) || [];
                    setPurchasedTracks(list);
                }
            } catch (e) {
                console.error('Library fetch error:', e);
                setPurchasedTracks([]);
            } finally {
                setLoading(false);
            }
        };
        run();
    }, []);

    return (
        <div className="flex flex-col min-h-screen lg:flex-row lg:h-screen lg:overflow-hidden bg-app-bg selection:bg-[#3b82f6]/30">
            <Sidebar filters={{}} onFilterChange={() => { }} />
            <div className="flex-1 flex flex-col min-w-0">
                <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
                <main className="flex-1 flex flex-col overflow-hidden">
                    <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="px-4 lg:px-10 py-6 lg:py-10 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                            <div>
                                <h2 className="text-2xl lg:text-4xl font-black text-app-text tracking-tighter uppercase leading-none">{t('myLibraryTitle')}</h2>
                                <p className="text-app-text-muted text-xs lg:text-sm font-bold mt-3 lg:mt-4 uppercase tracking-widest">
                                    {purchasedTracks.length} {t('purchasedCount')}
                                </p>
                            </div>
                        </div>

                        <div className="hidden lg:flex px-10 py-4 text-[11px] font-black text-app-text-muted uppercase tracking-[0.2em] border-b border-app-border bg-app-surface">
                            <div className="w-12"></div>
                            <div className="flex-1 pr-8">{t('titleArtist')}</div>
                            <div className="w-32">{t('genre')}</div>
                            <div className="w-64 px-8">{t('waveform')}</div>
                            <div className="w-20 text-center">BPM</div>
                            <div className="w-48 text-right">{t('download')}</div>
                        </div>

                        <div className="flex-1">
                            {loading ? (
                                <div className="px-10 py-12 text-app-text-muted text-sm font-bold">{t('loading')}</div>
                            ) : purchasedTracks.length > 0 ? (
                                purchasedTracks.map((track: any) => (
                                    <LibraryTrackRow key={`${track.id}-${track.order_id}`} track={track} />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-32 text-[#64748b]">
                                    <svg className="w-16 h-16 opacity-10 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8m0 0l3-3m-3 3L5 8m0 0h8M5 8V7" /></svg>
                                    <p className="font-black uppercase tracking-[0.2em]">{t('noPurchased')}</p>
                                    <p className="text-xs mt-2 font-bold">{t('noPurchasedHint')}</p>
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
                            filters={{}}
                            onFilterChange={() => { }}
                            onClose={closeMobileSidebar}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
