"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { useTranslations, useLocale } from 'next-intl';

type Track = {
    id: number;
    title: string;
    bpm: number;
    mode: string;
    category_id: number;
    genre_id: number;
    created_at: string;
    categories: { name: string } | null;
    genres: { name: string } | null;
    status: string;
    price: number | null;
};

export default function LibraryPage() {
    const t = useTranslations('Library');
    const locale = useLocale();
    const [tracks, setTracks] = useState<Track[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingTrack, setEditingTrack] = useState<Track | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [newPreviewFile, setNewPreviewFile] = useState<File | null>(null);
    const [newMasterFile, setNewMasterFile] = useState<File | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [settings, setSettings] = useState({ defaultPrice: 0, currency: 'TL' });

    const fetchTracks = async () => {
        setLoading(true);
        // Using Supabase join to get category and genre names
        const { data, error } = await supabase
            .from('tracks')
            .select(`
                id,
                title,
                bpm,
                mode,
                category_id,
                genre_id,
                created_at,
                status,
                price,
                categories ( name ),
                genres ( name )
            `)
            .order('created_at', { ascending: false });

        const { data: settingsData } = await supabase
            .from('settings')
            .select('default_price, currency')
            .eq('id', 1)
            .maybeSingle();

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

        if (settingsData) {
            setSettings({
                defaultPrice: Number(settingsData.default_price),
                currency: settingsData.currency || 'TL'
            });
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchTracks();
    }, []);

    const handleDelete = async (id: number) => {
        if (!confirm(t('deleteConfirm'))) return;

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

    const handleEdit = (track: Track) => {
        setEditingTrack({ ...track });
        setNewPreviewFile(null);
        setNewMasterFile(null);
        setIsEditModalOpen(true);
    };

    const handleUpdate = async () => {
        if (!editingTrack) return;

        setIsUpdating(true);
        try {
            let updateData: any = {
                title: editingTrack.title,
                bpm: editingTrack.bpm,
                mode: editingTrack.mode,
                status: editingTrack.status,
                price: (editingTrack.price === null || isNaN(Number(editingTrack.price))) ? settings.defaultPrice : Number(editingTrack.price)
            };

            // 1. Upload New Preview if selected
            if (newPreviewFile) {
                const previewExt = newPreviewFile.name.split('.').pop();
                const previewPath = `${Date.now()}_preview.${previewExt}`;
                const { error: previewError } = await supabase.storage
                    .from('previews')
                    .upload(previewPath, newPreviewFile);

                if (previewError) throw previewError;

                const { data: { publicUrl } } = supabase.storage
                    .from('previews')
                    .getPublicUrl(previewPath);
                updateData.preview_url = publicUrl;
            }

            // 2. Upload New Master if selected
            if (newMasterFile) {
                const masterExt = newMasterFile.name.split('.').pop();
                const masterPath = `${Date.now()}_master.${masterExt}`;
                const { error: masterError } = await supabase.storage
                    .from('masters')
                    .upload(masterPath, newMasterFile);

                if (masterError) throw masterError;
                updateData.master_url = masterPath;
            }

            const { error } = await supabase
                .from('tracks')
                .update(updateData)
                .eq('id', editingTrack.id);

            if (error) throw error;

            setIsEditModalOpen(false);
            fetchTracks();
        } catch (error: any) {
            alert(t('updateError') + ": " + error.message);
        } finally {
            setIsUpdating(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-admin-text tracking-tight">{t('title')}</h1>
                    <p className="text-admin-text-muted mt-1">{t('description')}</p>
                </div>
            </div>

            {loading ? <SkeletonLoader /> : (
                <div className="bg-admin-card rounded-3xl border border-admin-border overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-admin-bg border-b border-admin-border text-admin-text-muted text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-8 py-5">{t('table.name')}</th>
                                    <th className="px-8 py-5">{t('table.category')}</th>
                                    <th className="px-8 py-5">{t('table.genre')}</th>
                                    <th className="px-8 py-5">{t('table.bpm')}</th>
                                    <th className="px-8 py-5">{t('table.price')}</th>
                                    <th className="px-8 py-5">{t('table.status')}</th>
                                    <th className="px-8 py-5">{t('table.date')}</th>
                                    <th className="px-8 py-5 text-right">{t('table.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin-border">
                                {tracks.length > 0 ? tracks.map(track => (
                                    <tr key={track.id} className="hover:bg-admin-bg/30 transition-colors group">
                                        <td className="px-8 py-6">
                                            <div className="font-bold text-admin-text">{track.title}</div>
                                        </td>
                                        <td className="px-8 py-6 text-admin-text-muted">
                                            {track.categories?.name || '-'}
                                        </td>
                                        <td className="px-8 py-6 text-admin-text-muted">
                                            {track.genres?.name || '-'}
                                        </td>
                                        <td className="px-8 py-6 text-admin-text-muted">
                                            {track.bpm || '-'}
                                        </td>
                                        <td className="px-8 py-6 font-bold text-admin-primary">
                                            {track.price ? `${track.price} ${settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '₺'}` : '-'}
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${track.status === 'published'
                                                ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                                }`}>
                                                {track.status === 'published' ? t('table.published') : t('table.draft')}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-admin-text-muted text-sm">
                                            {formatDate(track.created_at)}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <div className="flex items-center justify-end gap-3">
                                                <button
                                                    onClick={() => handleEdit(track)}
                                                    className="p-2 text-admin-text-muted hover:text-admin-primary transition-colors"
                                                    title="Düzenle"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(track.id)}
                                                    className="p-2 text-admin-text-muted hover:text-red-400 transition-colors"
                                                    title="Sil"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={8} className="px-8 py-20 text-center text-admin-text-muted italic">
                                            {t('empty')}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingTrack && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-admin-card border border-admin-border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-2xl font-bold text-admin-text">{t('edit')}</h2>
                                <button onClick={() => setIsEditModalOpen(false)} className="text-admin-text-muted hover:text-admin-text transition-colors">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('table.name')}</label>
                                    <input
                                        type="text"
                                        value={editingTrack.title}
                                        onChange={(e) => setEditingTrack({ ...editingTrack, title: e.target.value })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('table.bpm')}</label>
                                        <input
                                            type="number"
                                            value={editingTrack.bpm || ''}
                                            onChange={(e) => setEditingTrack({ ...editingTrack, bpm: Number(e.target.value) })}
                                            className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('table.mode')}</label>
                                        <input
                                            type="text"
                                            value={editingTrack.mode || ''}
                                            onChange={(e) => setEditingTrack({ ...editingTrack, mode: e.target.value })}
                                            className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('table.price')} ({settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '₺'})</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={editingTrack.price || ''}
                                            onChange={(e) => setEditingTrack({ ...editingTrack, price: e.target.value ? Number(e.target.value) : null })}
                                            className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                            placeholder="0.00"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-admin-text-muted font-bold text-sm">
                                            {settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '₺'}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('table.status')}</label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setEditingTrack({ ...editingTrack, status: 'draft' })}
                                            className={`flex-1 py-3 rounded-xl border font-bold transition-all ${editingTrack.status === 'draft'
                                                ? 'bg-amber-500/10 border-amber-500/50 text-amber-500'
                                                : 'bg-admin-bg border-admin-border text-admin-text-muted'
                                                }`}
                                        >
                                            {t('table.draft')}
                                        </button>
                                        <button
                                            onClick={() => setEditingTrack({ ...editingTrack, status: 'published' })}
                                            className={`flex-1 py-3 rounded-xl border font-bold transition-all ${editingTrack.status === 'published'
                                                ? 'bg-green-500/10 border-green-500/50 text-green-500'
                                                : 'bg-admin-bg border-admin-border text-admin-text-muted'
                                                }`}
                                        >
                                            {t('table.published')}
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider text-[10px]">{t('changePreview')}</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                accept="audio/mpeg,audio/mp3"
                                                onChange={(e) => setNewPreviewFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="edit-preview"
                                            />
                                            <label
                                                htmlFor="edit-preview"
                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-all text-xs font-medium truncate ${newPreviewFile
                                                    ? 'bg-admin-primary/10 border-admin-primary text-admin-primary'
                                                    : 'bg-admin-bg border-admin-border text-admin-text-muted hover:border-admin-primary/50'
                                                    }`}
                                            >
                                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                                                {newPreviewFile ? newPreviewFile.name : 'Dosya Seç'}
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider text-[10px]">{t('changeMaster')}</label>
                                        <div className="relative group">
                                            <input
                                                type="file"
                                                onChange={(e) => setNewMasterFile(e.target.files?.[0] || null)}
                                                className="hidden"
                                                id="edit-master"
                                            />
                                            <label
                                                htmlFor="edit-master"
                                                className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed cursor-pointer transition-all text-xs font-medium truncate ${newMasterFile
                                                    ? 'bg-admin-primary/10 border-admin-primary text-admin-primary'
                                                    : 'bg-admin-bg border-admin-border text-admin-text-muted hover:border-admin-primary/50'
                                                    }`}
                                            >
                                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                {newMasterFile ? newMasterFile.name : 'Dosya Seç'}
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    disabled={isUpdating}
                                    className="flex-1 px-5 py-3 rounded-xl bg-admin-bg text-admin-text-muted font-medium hover:bg-admin-border transition-colors disabled:opacity-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleUpdate}
                                    disabled={isUpdating}
                                    className="flex-1 px-5 py-3 rounded-xl bg-admin-primary text-admin-bg font-bold hover:bg-admin-primary/90 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {isUpdating ? t('updating') : t('update')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
