"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/context/SearchContext';
import { TrackRow } from './TrackRow';
import { SkeletonLoader } from '../admin/SkeletonLoader';

type SortOption = 'relevance' | 'newest' | 'priceLow' | 'priceHigh';

interface TrackListProps {
    filters: any;
    currency: string;
}

export const TrackList: React.FC<TrackListProps> = ({ filters, currency }) => {
    const t = useTranslations('App');
    const { query: searchQuery } = useSearch();
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState<SortOption>('newest');

    useEffect(() => {
        fetchTracks();
    }, [filters, searchQuery, sortBy]);

    const fetchTracks = async () => {
        try {
            setLoading(true);
            let q = supabase
                .from('tracks')
                .select('*, categories(name), genres(name), modes(name)', { count: 'exact' })
                .eq('status', 'published');

            const catId = filters.categoryId != null && filters.categoryId !== '' ? Number(filters.categoryId) : null;
            if (catId != null) {
                q = q.eq('category_id', catId);
            }
            if (filters.genres?.length > 0) {
                q = q.in('genre_id', filters.genres);
            }
            if (filters.modeId) {
                q = q.eq('mode_id', filters.modeId);
            }
            const priceMin = filters.priceRange?.[0], priceMax = filters.priceRange?.[1];
            const [boundsMin, boundsMax] = [filters.priceBounds?.[0] ?? 0, filters.priceBounds?.[1] ?? 10000];
            const priceFullRange = priceMin === boundsMin && priceMax === boundsMax;
            if (filters.priceRange?.length === 2 && !priceFullRange) {
                if (priceMin != null) q = q.gte('price', priceMin);
                if (priceMax != null) q = q.lte('price', priceMax);
            }
            const bpmLo = filters.bpmRange?.[0], bpmHi = filters.bpmRange?.[1];
            const bpmFullRange = bpmLo === 0 && bpmHi === 300;
            if (filters.bpmRange?.length === 2 && !bpmFullRange && (bpmLo != null || bpmHi != null)) {
                if (bpmLo != null) q = q.gte('bpm', bpmLo);
                if (bpmHi != null) q = q.lte('bpm', bpmHi);
            }

            const trimmed = searchQuery.trim();
            if (trimmed.length > 0) {
                q = q.or(`title.ilike.%${trimmed}%,artist_name.ilike.%${trimmed}%`);
            }

            if (sortBy === 'newest' || sortBy === 'relevance') {
                q = q.order('created_at', { ascending: false });
            } else if (sortBy === 'priceLow') {
                q = q.order('price', { ascending: true });
            } else {
                q = q.order('price', { ascending: false });
            }

            const { data, count } = await q;

            if (data) {
                setTracks(data);
                setTotalCount(count || 0);
            }
        } catch (err) {
            console.error('Error fetching tracks:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10"><SkeletonLoader /></div>;

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="px-10 py-10 flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">{t('browseTracks')}</h2>
                    <p className="text-[#64748b] text-sm font-bold mt-4 uppercase tracking-widest">
                        {totalCount} {t('resultsFound')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">{t('sortBy')}</span>
                    <div className="relative">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-[#1e293b]/50 border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white font-bold appearance-none pr-10 focus:outline-none focus:border-white/20 transition-all cursor-pointer"
                        >
                            <option value="relevance">{t('relevance')}</option>
                            <option value="newest">{t('newest')}</option>
                            <option value="priceLow">{t('priceLow')}</option>
                            <option value="priceHigh">{t('priceHigh')}</option>
                        </select>
                        <svg className="w-4 h-4 text-[#64748b] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            <div className="px-10 py-4 flex text-[11px] font-black text-[#64748b] uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <div className="w-12"></div>
                <div className="flex-1 pr-8">{t('titleArtist')}</div>
                <div className="w-32">{t('genre')}</div>
                <div className="w-64 px-8">{t('waveform')}</div>
                <div className="w-20 text-center">BPM</div>
                <div className="w-40 text-right">{t('action')}</div>
            </div>

            <div className="flex-1">
                {tracks.length > 0 ? (
                    tracks.map(track => (
                        <TrackRow key={track.id} track={track} currency={currency} queue={tracks} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-[#64748b]">
                        <svg className="w-16 h-16 opacity-10 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        <p className="font-black uppercase tracking-[0.2em]">{t('noTracksFilter')}</p>
                    </div>
                )}
            </div>

            <div className="h-32 shrink-0" />
        </div>
    );
};
