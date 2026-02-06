"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { TrackRow } from './TrackRow';
import { SkeletonLoader } from '../admin/SkeletonLoader';

interface TrackListProps {
    filters: any;
    currency: string;
}

export const TrackList: React.FC<TrackListProps> = ({ filters, currency }) => {
    const [tracks, setTracks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    useEffect(() => {
        fetchTracks();
    }, [filters]);

    const fetchTracks = async () => {
        try {
            setLoading(true);
            let query = supabase
                .from('tracks')
                .select('*, categories(name), genres(name), modes(name)', { count: 'exact' })
                .eq('status', 'published');

            if (filters.categoryId) {
                query = query.eq('category_id', filters.categoryId);
            }
            if (filters.modeId) {
                query = query.eq('mode_id', filters.modeId);
            }
            if (filters.maxPrice) {
                query = query.lte('price', filters.maxPrice);
            }

            if (filters.bpmRange) {
                query = query.gte('bpm', filters.bpmRange[0]).lte('bpm', filters.bpmRange[1]);
            }

            const { data, count, error } = await query.order('created_at', { ascending: false });

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
            {/* List Header */}
            <div className="px-10 py-10 flex items-end justify-between">
                <div>
                    <h2 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Browse Tracks</h2>
                    <p className="text-[#64748b] text-sm font-bold mt-4 uppercase tracking-widest">
                        {totalCount} results found
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-[#64748b] uppercase tracking-widest">Sort by:</span>
                    <div className="relative">
                        <select className="bg-[#1e293b]/50 border border-[#1e293b] rounded-xl px-4 py-2 text-xs text-white font-bold appearance-none pr-10 focus:outline-none focus:border-white/20 transition-all">
                            <option>Relevance</option>
                            <option>Newest</option>
                            <option>Price: Low to High</option>
                            <option>Price: High to Low</option>
                        </select>
                        <svg className="w-4 h-4 text-[#64748b] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
            </div>

            {/* Table Header */}
            <div className="px-10 py-4 flex text-[11px] font-black text-[#64748b] uppercase tracking-[0.2em] border-b border-white/5 bg-white/[0.01]">
                <div className="w-12"></div>
                <div className="flex-1 pr-8">Title / Artist</div>
                <div className="w-32">Genre</div>
                <div className="w-64 px-8">Waveform</div>
                <div className="w-20 text-center">BPM</div>
                <div className="w-32 text-right">Action</div>
            </div>

            {/* Rows */}
            <div className="flex-1">
                {tracks.length > 0 ? (
                    tracks.map(track => (
                        <TrackRow key={track.id} track={track} currency={currency} />
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-[#64748b]">
                        <svg className="w-16 h-16 opacity-10 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        <p className="font-black uppercase tracking-[0.2em]">No tracks found with selected filters</p>
                    </div>
                )}
            </div>

            {/* Spacer for Global Player */}
            <div className="h-32 shrink-0" />
        </div>
    );
};
