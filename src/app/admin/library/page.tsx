"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';

type Track = {
    id: number;
    title: string;
    bpm: number;
    created_at: string;
    categories: { name: string } | null;
    genres: { name: string } | null;
};

export default function LibraryPage() {
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchTracks = async () => {
        setLoading(true);
        // Using Supabase join to get category and genre names
        const { data, error } = await supabase
            .from('tracks')
            .select(`
                id,
                title,
                bpm,
                created_at,
                categories ( name ),
                genres ( name )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching tracks:', error);
        } else if (data) {
            // Transform data as Supabase sometimes returns single objects or arrays depending on schema inference
            const formattedTracks = (data as any[]).map(track => ({
                ...track,
                categories: Array.isArray(track.categories) ? track.categories[0] : track.categories,
                genres: Array.isArray(track.genres) ? track.genres[0] : track.genres
            }));
            setTracks(formattedTracks);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTracks();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm("Bu eseri silmek istediğinize emin misiniz?")) return;

        const { error } = await supabase
            .from('tracks')
            .delete()
            .eq('id', id);

        if (error) {
            alert("Hata: " + error.message);
        } else {
            fetchTracks();
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Kütüphane</h1>
                    <p className="text-slate-400 mt-1">Yüklediğiniz tüm eserleri buradan yönetebilirsiniz.</p>
                </div>
            </div>

            {loading ? <SkeletonLoader /> : (
                <div className="bg-[#151e32] rounded-3xl border border-[#1e293b] overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-[#0b1121] border-b border-[#1e293b] text-slate-400 text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-8 py-5">ESER ADI</th>
                                    <th className="px-8 py-5">KATEGORİ</th>
                                    <th className="px-8 py-5">TÜR</th>
                                    <th className="px-8 py-5">BPM</th>
                                    <th className="px-8 py-5">TARİH</th>
                                    <th className="px-8 py-5 text-right">İŞLEMLER</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#1e293b]">
                                {tracks.length > 0 ? tracks.map(track => (
                                    <tr key={track.id} className="hover:bg-[#1e293b]/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-white">{track.title}</div>
                                        </td>
                                        <td className="px-8 py-6 text-slate-300">
                                            {track.categories?.name || '-'}
                                        </td>
                                        <td className="px-8 py-6 text-slate-300">
                                            {track.genres?.name || '-'}
                                        </td>
                                        <td className="px-8 py-6 text-slate-300">
                                            {track.bpm || '-'}
                                        </td>
                                        <td className="px-8 py-6 text-slate-400 text-sm">
                                            {formatDate(track.created_at)}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    className="p-2 text-slate-400 hover:text-[#ede066] transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(track.id)}
                                                    className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                                                    title="Sil"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={6} className="px-8 py-20 text-center text-slate-500 italic">
                                            Henüz yüklü bir eser bulunamadı.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
