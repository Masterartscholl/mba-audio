"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { useSearch } from '@/context/SearchContext';
import { useAuth } from '@/hooks/useAuth';
import { TrackRow } from './TrackRow';
import { SkeletonLoader } from '../admin/SkeletonLoader';

type SortOption = 'relevance' | 'newest' | 'priceLow' | 'priceHigh';

interface TrackListProps {
    filters: any;
    currency: string;
    selectedCategoryName?: string | null;
}



export const TrackList: React.FC<TrackListProps> = ({ filters, currency, selectedCategoryName }) => {
    const t = useTranslations('App');
    const { query: searchQuery } = useSearch();
    const { user } = useAuth();
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCount, setTotalCount] = useState(0);
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [purchasedTrackIds, setPurchasedTrackIds] = useState<number[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    useEffect(() => {
        setCurrentPage(1);
    }, [filters, searchQuery, sortBy]);

    const purchasedCacheRef = useRef<{ value: number[] | null }>({ value: null });
    const retryCountRef = useRef(0);

    // Load purchased IDs from localStorage immediately for instant display
    useEffect(() => {
        if (typeof window !== 'undefined' && user) {
            const cached = localStorage.getItem('mba_purchased_ids');
            if (cached) {
                try {
                    const ids = JSON.parse(cached);
                    if (Array.isArray(ids) && ids.length > 0) {
                        setPurchasedTrackIds(ids);
                        purchasedCacheRef.current.value = ids;
                    }
                } catch (e) { /* ignore */ }
            }
        }
    }, []); // Run once on mount

    useEffect(() => {
        const fetchPurchased = async () => {
            if (user) {
                if (purchasedCacheRef.current.value) {
                    setPurchasedTrackIds(purchasedCacheRef.current.value);
                    return;
                }

                try {
                    // Force get session to ensure we have a token even if cookies are blocked (iframe)
                    const { data: { session } } = await supabase.auth.getSession();
                    const token = session?.access_token;

                    const headers: Record<string, string> = {};
                    if (token) headers['Authorization'] = `Bearer ${token}`;

                    const res = await fetch('/api/me/purchased-track-ids', { headers });
                    const data = await res.json();

                    const ids = Array.isArray(data?.trackIds) ? data.trackIds : [];
                    purchasedCacheRef.current.value = ids;
                    setPurchasedTrackIds(ids);

                    // Persist to localStorage for instant display on next page load
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('mba_purchased_ids', JSON.stringify(ids));
                    }
                } catch (err) {
                    console.error('Failed to fetch purchased tracks:', err);
                    purchasedCacheRef.current.value = [];
                    setPurchasedTrackIds([]);
                }
            } else {
                setPurchasedTrackIds([]);
                purchasedCacheRef.current.value = null;
                // Clear localStorage when logged out
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('mba_purchased_ids');
                }
            }
        };

        fetchPurchased();
    }, [user]);

    const fetchTracks = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Fast path: Load from cache
            if (typeof window !== 'undefined' && !searchQuery) {
                const cached = localStorage.getItem('mba_tracks_cache');
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        setTracks(parsed);
                        setTotalCount(parsed.length);
                        setLoading(false);
                    } catch (e) {
                        console.warn('Tracks cache parse error', e);
                    }
                }
            }

            // Timeout logic - reduced to 10s for faster failure
            const timeoutId = setTimeout(() => {
                console.warn('TrackList: tracks fetch timed out (10s)');
                setLoading(false);
            }, 10000);

            let q = supabase
                .from('tracks')
                .select(
                    [
                        'id',
                        'title',
                        'artist_name',
                        'preview_url',
                        'image_url',
                        'price',
                        'bpm',
                        'category_id',
                        'genre_id',
                        'status',
                        'created_at',
                        'genres(name, name_en)',
                        'modes(name, name_en)',
                    ].join(','),
                    { count: 'exact' }
                )
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
            // If searching, we fetch a larger range to filter client-side
            // for title, artist, genre, and mood names.
            const fetchLimit = trimmed.length > 0 ? 499 : 99;

            if (sortBy === 'newest' || sortBy === 'relevance') {
                q = q.order('created_at', { ascending: false });
            } else if (sortBy === 'priceLow') {
                q = q.order('price', { ascending: true });
            } else {
                q = q.order('price', { ascending: false });
            }

            const { data, error: queryError } = await q.range(0, fetchLimit);
            clearTimeout(timeoutId);

            if (queryError) {
                console.error('Tracks query error:', queryError);
                // Fallback sorgu
                const fallback = await supabase
                    .from('tracks')
                    .select(
                        [
                            'id', 'title', 'artist_name', 'preview_url', 'image_url',
                            'price', 'bpm', 'category_id', 'genre_id', 'status', 'created_at',
                            'genres(name, name_en)', 'modes(name, name_en)',
                        ].join(','),
                        { count: 'exact' }
                    )
                    .eq('status', 'published')
                    .order('created_at', { ascending: false })
                    .range(0, fetchLimit);
                if (fallback.data) {
                    const trimmedInner = searchQuery.trim().toLowerCase();
                    const filtered = trimmedInner
                        ? fallback.data.filter((track: any) => {
                            const genreName = track.genres?.name ? String(track.genres.name).toLowerCase() : '';
                            const genreNameEn = track.genres?.name_en ? String(track.genres.name_en).toLowerCase() : '';
                            const moodName = track.modes?.name ? String(track.modes.name).toLowerCase() : '';
                            const moodNameEn = track.modes?.name_en ? String(track.modes.name_en).toLowerCase() : '';
                            const title = track.title ? String(track.title).toLowerCase() : '';
                            const artist = track.artist_name ? String(track.artist_name).toLowerCase() : '';
                            return title.includes(trimmedInner) ||
                                artist.includes(trimmedInner) ||
                                genreName.includes(trimmedInner) ||
                                genreNameEn.includes(trimmedInner) ||
                                moodName.includes(trimmedInner) ||
                                moodNameEn.includes(trimmedInner);
                        })
                        : fallback.data;

                    setTracks(filtered);
                    setTotalCount(filtered.length);
                }
            } else if (data) {
                const trimmedInner = searchQuery.trim().toLowerCase();
                const filtered = trimmedInner
                    ? data.filter((track: any) => {
                        const genreName = track.genres?.name ? String(track.genres.name).toLowerCase() : '';
                        const genreNameEn = track.genres?.name_en ? String(track.genres.name_en).toLowerCase() : '';
                        const moodName = track.modes?.name ? String(track.modes.name).toLowerCase() : '';
                        const moodNameEn = track.modes?.name_en ? String(track.modes.name_en).toLowerCase() : '';
                        const title = track.title ? String(track.title).toLowerCase() : '';
                        const artist = track.artist_name ? String(track.artist_name).toLowerCase() : '';
                        return title.includes(trimmedInner) ||
                            artist.includes(trimmedInner) ||
                            genreName.includes(trimmedInner) ||
                            genreNameEn.includes(trimmedInner) ||
                            moodName.includes(trimmedInner) ||
                            moodNameEn.includes(trimmedInner);
                    })
                    : data;

                setTracks(filtered);
                setTotalCount(filtered.length);
                retryCountRef.current = 0;

                // Update cache only if not searching
                if (typeof window !== 'undefined' && !searchQuery) {
                    localStorage.setItem('mba_tracks_cache', JSON.stringify(filtered.slice(0, 100)));
                }
            }
        } catch (err) {
            console.error('Error fetching tracks:', err);
            setError(err instanceof Error ? err.message : 'Veriler yüklenemedi');
        } finally {
            setLoading(false);
        }
    }, [filters, searchQuery, sortBy]);

    useEffect(() => {
        fetchTracks();
    }, [fetchTracks]);

    if (loading) return (
        <div className="p-6 lg:p-10">
            <SkeletonLoader />
        </div>
    );

    if (error) return (
        <div className="flex flex-col items-center justify-center py-32 text-app-text-muted gap-4">
            <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            <p className="font-bold uppercase tracking-wider text-sm">{error}</p>
            <button
                type="button"
                onClick={fetchTracks}
                className="px-6 py-2 rounded-xl bg-app-primary text-app-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity"
            >
                {t('retry') || 'Tekrar Dene'}
            </button>
        </div>
    );

    const headingTitle =
        selectedCategoryName && String(selectedCategoryName).trim().length > 0
            ? selectedCategoryName
            : t('browseTracks');

    const startIndex = (currentPage - 1) * itemsPerPage;
    const visibleTracks = tracks.slice(startIndex, startIndex + itemsPerPage);
    const totalPages = Math.ceil(totalCount / itemsPerPage);

    return (
        <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col">
            <div className="px-4 lg:px-10 py-6 lg:py-10 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl lg:text-4xl font-black text-app-text tracking-tighter uppercase leading-none">{headingTitle}</h2>
                    <p className="text-app-text-muted text-xs lg:text-sm font-bold mt-2 lg:mt-4 uppercase tracking-widest">
                        {totalCount} {t('resultsFound')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-app-text-muted uppercase tracking-widest">{t('sortBy')}</span>
                    <div className="relative">
                        <select
                            id="sortBy"
                            name="sortBy"
                            aria-label={t('sortBy')}
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as SortOption)}
                            className="bg-app-surface border border-app-border rounded-xl px-4 py-2 text-xs text-app-text font-bold appearance-none pr-10 focus:outline-none focus:border-app-primary/50 transition-all cursor-pointer"
                        >
                            <option value="relevance">{t('relevance')}</option>
                            <option value="newest">{t('newest')}</option>
                            <option value="priceLow">{t('priceLow')}</option>
                            <option value="priceHigh">{t('priceHigh')}</option>
                        </select>
                        <svg className="w-4 h-4 text-app-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            <div className="hidden lg:flex px-10 py-4 text-[11px] font-black text-app-text-muted uppercase tracking-[0.2em] border-b border-app-border bg-app-surface">
                <div className="w-12 flex-shrink-0"></div>
                <div className="flex-1 min-w-0 pr-8">{t('titleArtist')}</div>
                <div className="w-32">{t('genre')}</div>
                <div className="w-64 px-8">{t('waveform')}</div>
                <div className="w-20 text-center">BPM</div>
                <div className="w-48 text-right pr-4">{t('action')}</div>
            </div>

            <div className="flex-1">
                {visibleTracks.length > 0 ? (
                    visibleTracks.map(track => (
                        <TrackRow key={track.id} track={track} currency={currency} queue={visibleTracks} purchasedTrackIds={purchasedTrackIds} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-app-text-muted">
                        <svg className="w-16 h-16 opacity-10 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        <p className="font-black uppercase tracking-[0.2em]">{t('noTracksFilter')}</p>
                    </div>
                )}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center py-6 gap-4 border-t border-app-border">
                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-xl bg-app-surface border border-app-border text-[11px] lg:text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-app-card transition-colors"
                    >
                        {t('prev')}
                    </button>
                    <span className="text-[11px] lg:text-xs font-bold text-app-text-muted">
                        {currentPage} / {totalPages}
                    </span>
                    <button
                        type="button"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-xl bg-app-surface border border-app-border text-[11px] lg:text-xs font-bold uppercase tracking-wider disabled:opacity-50 hover:bg-app-card transition-colors"
                    >
                        {t('next')}
                    </button>
                </div>
            )}


            <div className="h-40 lg:h-32 shrink-0" />
        </div>
    );
};
