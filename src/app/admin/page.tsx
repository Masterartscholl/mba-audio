"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { useTranslations, useLocale } from 'next-intl';

type Category = {
    id: number;
    name: string;
};

type Genre = {
    id: number;
    name: string;
    category_id: number;
};

export default function AdminDashboard() {
    const t = useTranslations('Dashboard');
    const locale = useLocale();
    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);
    const [recentTracks, setRecentTracks] = useState<any[]>([]);
    const [settings, setSettings] = useState({ defaultPrice: 0, currency: 'TL' });

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        categoryId: "",
        genreId: "",
        bpm: "",
        mode: "",
        price: ""
    });

    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [masterFile, setMasterFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState({ preview: 0, master: 0 });

    const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);
    const [isDragging, setIsDragging] = useState<{ preview: boolean; master: boolean }>({ preview: false, master: false });

    const previewInputRef = React.useRef<HTMLInputElement>(null);
    const masterInputRef = React.useRef<HTMLInputElement>(null);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: catData } = await supabase.from('categories').select('*').order('name');
            const { data: genData } = await supabase.from('genres').select('*').order('name');
            const { data: trackData } = await supabase
                .from('tracks')
                .select('*, categories(name), genres(name)')
                .order('created_at', { ascending: false })
                .limit(5);

            const { data: settingsData } = await supabase
                .from('settings')
                .select('default_price, currency')
                .eq('id', 1)
                .maybeSingle();

            if (catData) setCategories(catData);
            if (genData) setGenres(genData);
            if (trackData) setRecentTracks(trackData);
            if (settingsData) {
                setSettings({
                    defaultPrice: Number(settingsData.default_price),
                    currency: settingsData.currency || 'TL'
                });
            }
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Sync Genres based on Category Selection
    useEffect(() => {
        if (formData.categoryId) {
            const filtered = genres.filter((g: Genre) => g.category_id === Number(formData.categoryId));
            setAvailableGenres(filtered);
        } else {
            setAvailableGenres([]);
        }
    }, [formData.categoryId, genres]);

    // Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === 'categoryId') {
            setFormData(prev => ({ ...prev, [name]: value, genreId: "" }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleAction = async (status: 'published' | 'draft') => {
        if (!formData.title) {
            alert(t('trackTitle') + " " + "zorunludur."); // Simple localized alert for now
            return;
        }

        if (status === 'published' && (!formData.categoryId || !formData.genreId || !previewFile || !masterFile)) {
            alert(t('messages.fileRequired'));
            return;
        }

        setLoading(true);
        try {
            let previewUrl = "";
            let masterPath = "";

            // 1. Upload Preview File if exists
            if (previewFile) {
                const previewExt = previewFile.name.split('.').pop();
                const previewPath = `${Date.now()}_preview.${previewExt}`;
                setUploadProgress(prev => ({ ...prev, preview: 20 }));
                const { error: previewError } = await supabase.storage
                    .from('previews')
                    .upload(previewPath, previewFile);
                if (previewError) throw previewError;
                setUploadProgress(prev => ({ ...prev, preview: 100 }));

                const { data: { publicUrl } } = supabase.storage
                    .from('previews')
                    .getPublicUrl(previewPath);
                previewUrl = publicUrl;
            }

            // 2. Upload Master File if exists
            if (masterFile) {
                const masterExt = masterFile.name.split('.').pop();
                const masterPathString = `${Date.now()}_master.${masterExt}`;
                setUploadProgress(prev => ({ ...prev, master: 20 }));
                const { error: masterError } = await supabase.storage
                    .from('masters')
                    .upload(masterPathString, masterFile);
                if (masterError) throw masterError;
                setUploadProgress(prev => ({ ...prev, master: 100 }));
                masterPath = masterPathString;
            }

            // 3. Save to Database
            const { error } = await supabase
                .from('tracks')
                .insert([{
                    title: formData.title,
                    category_id: formData.categoryId ? Number(formData.categoryId) : null,
                    genre_id: formData.genreId ? Number(formData.genreId) : null,
                    bpm: formData.bpm ? Number(formData.bpm) : null,
                    mode: formData.mode,
                    price: formData.price ? Number(formData.price) : settings.defaultPrice,
                    preview_url: previewUrl,
                    master_url: masterPath,
                    status: status
                }]);

            if (error) throw error;

            alert(status === 'published' ? t('messages.success') : t('messages.success'));

            // Clear Form
            setFormData({ title: "", categoryId: "", genreId: "", bpm: "", mode: "", price: "" });
            setPreviewFile(null);
            setMasterFile(null);
            setUploadProgress({ preview: 0, master: 0 });

            // Refresh recent tracks
            fetchData();
        } catch (error: any) {
            alert(t('messages.error') + ": " + error.message);
        } finally {
            setLoading(false);
        }
    };
    const handleDragOver = (e: React.DragEvent, type: 'preview' | 'master') => {
        e.preventDefault();
        setIsDragging(prev => ({ ...prev, [type]: true }));
    };

    const handleDragLeave = (type: 'preview' | 'master') => {
        setIsDragging(prev => ({ ...prev, [type]: false }));
    };

    const handleDrop = (e: React.DragEvent, type: 'preview' | 'master') => {
        e.preventDefault();
        setIsDragging(prev => ({ ...prev, [type]: false }));
        const file = e.dataTransfer.files?.[0];
        if (file) {
            if (type === 'preview') setPreviewFile(file);
            else setMasterFile(file);
        }
    };

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">{t('title')}</h1>
                    <p className="text-slate-400 mt-1">{t('description')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => handleAction('draft')}
                        disabled={loading}
                        className="px-5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2A3B55] text-slate-300 font-medium transition-colors border border-[#2A3B55] disabled:opacity-50"
                    >
                        {loading ? t('updating') : t('quickUpload')}
                    </button>
                    <button
                        onClick={() => handleAction('published')}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-[#ede066] hover:bg-[#d4c95b] text-[#0b1121] font-bold shadow-[0_4px_20px_rgba(237,224,102,0.2)] hover:shadow-[0_4px_30_rgba(237,224,102,0.4)] transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50">
                        <span>{loading ? t('updating') : t('publish')}</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                    </button>
                </div>
            </div>

            {loading && !categories.length ? <SkeletonLoader /> : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    {/* Left Col */}
                    <div className="xl:col-span-1 space-y-6">
                        <div className="bg-[#151e32] rounded-3xl p-6 md:p-8 border border-[#1e293b] shadow-xl">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 rounded-xl bg-[#0b1121] flex items-center justify-center text-[#ede066] border border-[#2A3B55] shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <h2 className="text-xl font-bold text-white">{t('trackTitle')}</h2>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('trackTitle')}</label>
                                    <input
                                        name="title"
                                        value={formData.title}
                                        onChange={handleChange}
                                        type="text"
                                        placeholder="Örn: Midnight City"
                                        className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all font-medium"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('category')}</label>
                                    <div className="relative">
                                        <select
                                            name="categoryId"
                                            value={formData.categoryId}
                                            onChange={handleChange}
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 cursor-pointer font-medium">
                                            <option value="">{t('selectFile')}</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                        <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('genre')}</label>
                                    <div className="relative">
                                        <select
                                            name="genreId"
                                            value={formData.genreId}
                                            onChange={handleChange}
                                            disabled={!formData.categoryId}
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                                            <option value="">{t('selectFile')}</option>
                                            {availableGenres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                        <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('bpm')}</label>
                                        <input
                                            name="bpm"
                                            value={formData.bpm}
                                            onChange={handleChange}
                                            type="number"
                                            placeholder="120"
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('mode')}</label>
                                        <input
                                            name="mode"
                                            value={formData.mode}
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="Örn: C Minor"
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">{t('price')} ({settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '₺'})</label>
                                    <div className="relative">
                                        <input
                                            name="price"
                                            value={formData.price}
                                            onChange={handleChange}
                                            type="number"
                                            placeholder="0.00"
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all font-medium"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">
                                            {settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '₺'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Col */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-[#151e32] rounded-3xl p-6 md:p-8 border border-[#1e293b] shadow-xl flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-[#0b1121] flex items-center justify-center text-[#ede066] border border-[#2A3B55] shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">{t('messages.fileRequired')}</h2>
                                    <p className="text-sm text-slate-400">{t('description')}</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 flex-1">
                                <div
                                    onDragOver={(e) => handleDragOver(e, 'preview')}
                                    onDragLeave={() => handleDragLeave('preview')}
                                    onDrop={(e) => handleDrop(e, 'preview')}
                                    onClick={() => previewInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative overflow-hidden min-h-[220px] ${isDragging.preview
                                        ? 'border-[#ede066] bg-[#ede066]/10 scale-[1.02]'
                                        : 'border-[#2A3B55] bg-[#0b1121]/50 hover:border-[#ede066] hover:bg-[#0b1121]'
                                        }`}>
                                    <input
                                        type="file"
                                        ref={previewInputRef}
                                        className="hidden"
                                        accept="audio/mpeg,audio/mp3"
                                        onChange={(e) => setPreviewFile(e.target.files?.[0] || null)}
                                    />
                                    {previewFile && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setPreviewFile(null);
                                            }}
                                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all pointer-events-auto"
                                            title="Dosyayı Kaldır"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                    <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 group-hover:text-[#ede066] group-hover:scale-110 transition-all mb-4 z-10 border border-[#2A3B55]">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    </div>
                                    <h3 className="font-semibold text-white z-10">{previewFile ? previewFile.name : t('previewFile')}</h3>
                                    <p className="text-xs text-slate-500 mt-2 z-10 max-w-[200px] leading-relaxed">
                                        {previewFile ? `${(previewFile.size / (1024 * 1024)).toFixed(2)} MB` : t('selectFile') + ' (MP3 - Max 10MB).'}
                                    </p>
                                    {uploadProgress.preview > 0 && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-[#ede066] transition-all duration-300" style={{ width: `${uploadProgress.preview}%` }}></div>
                                    )}
                                </div>

                                <div
                                    onDragOver={(e) => handleDragOver(e, 'master')}
                                    onDragLeave={() => handleDragLeave('master')}
                                    onDrop={(e) => handleDrop(e, 'master')}
                                    onClick={() => masterInputRef.current?.click()}
                                    className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all cursor-pointer group relative overflow-hidden min-h-[220px] ${isDragging.master
                                        ? 'border-[#ede066] bg-[#ede066]/10 scale-[1.02]'
                                        : 'border-[#2A3B55] bg-[#0b1121]/50 hover:border-[#ede066] hover:bg-[#0b1121]'
                                        }`}>
                                    <input
                                        type="file"
                                        ref={masterInputRef}
                                        className="hidden"
                                        onChange={(e) => setMasterFile(e.target.files?.[0] || null)}
                                    />
                                    {masterFile && (
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setMasterFile(null);
                                            }}
                                            className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all pointer-events-auto"
                                            title="Dosyayı Kaldır"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                        </button>
                                    )}
                                    <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 group-hover:text-[#ede066] group-hover:scale-110 transition-all mb-4 z-10 border border-[#2A3B55]">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <h3 className="font-semibold text-white z-10">{masterFile ? masterFile.name : t('masterFile')}</h3>
                                    <p className="text-xs text-slate-500 mt-2 z-10 max-w-[200px] leading-relaxed">
                                        {masterFile ? `${(masterFile.size / (1024 * 1024)).toFixed(2)} MB` : t('selectFile') + ' (WAV/MP3).'}
                                    </p>
                                    {uploadProgress.master > 0 && (
                                        <div className="absolute bottom-0 left-0 h-1 bg-[#ede066] transition-all duration-300" style={{ width: `${uploadProgress.master}%` }}></div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Recent Tracks Table --- */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-white tracking-tight">{t('recentUploads')}</h2>
                    <Link href="/admin/library" className="text-[#ede066] text-sm font-bold hover:underline cursor-pointer">{t('recentUploads')}</Link>
                </div>

                <div className="bg-[#151e32] rounded-3xl border border-[#1e293b] overflow-hidden shadow-xl">
                    <table className="w-full text-left">
                        <thead className="bg-[#0b1121] border-b border-[#1e293b] text-slate-400 text-xs uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-8 py-4">{t('table.title')}</th>
                                <th className="px-8 py-4">{t('table.category')} / {t('table.genre')}</th>
                                <th className="px-8 py-4">{t('bpm')}</th>
                                <th className="px-8 py-4">{t('price')}</th>
                                <th className="px-8 py-4">{t('table.status')}</th>
                                <th className="px-8 py-4">{t('table.date')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e293b]">
                            {recentTracks.length > 0 ? recentTracks.map((track: any) => (
                                <tr key={track.id} className="hover:bg-[#1e293b]/30 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-bold text-white">{track.title}</div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="text-slate-300">{track.categories?.name}</span>
                                        <span className="text-slate-500 mx-2">/</span>
                                        <span className="text-slate-400 text-sm">{track.genres?.name}</span>
                                    </td>
                                    <td className="px-8 py-5 text-slate-300">{track.bpm || '-'}</td>
                                    <td className="px-8 py-5 font-bold text-[#ede066]">
                                        {track.price ? `${track.price} ${settings.currency === 'USD' ? '$' : settings.currency === 'EUR' ? '€' : '₺'}` : '-'}
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${track.status === 'published'
                                            ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                            }`}>
                                            {track.status === 'published' ? t('table.published') : t('table.draft')}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5 text-slate-500 text-sm">
                                        {new Date(track.created_at).toLocaleDateString(locale)}
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} className="px-8 py-10 text-center text-slate-500 italic">{t('empty')}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
