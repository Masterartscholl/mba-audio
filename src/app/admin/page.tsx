"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';

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
    // Data State
    const [categories, setCategories] = useState<Category[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        title: "",
        categoryId: "",
        genreId: "",
        bpm: "",
        mode: ""
    });

    const [availableGenres, setAvailableGenres] = useState<Genre[]>([]);

    // Fetch Data
    const fetchData = async () => {
        setLoading(true);
        const { data: catData } = await supabase.from('categories').select('*').order('name');
        const { data: genData } = await supabase.from('genres').select('*').order('name');

        if (catData) setCategories(catData);
        if (genData) setGenres(genData);
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Sync Genres based on Category Selection
    useEffect(() => {
        if (formData.categoryId) {
            const filtered = genres.filter(g => g.category_id === Number(formData.categoryId));
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

    const handlePublish = async () => {
        if (!formData.title || !formData.categoryId || !formData.genreId) {
            alert("Lütfen zorunlu alanları (Eser Adı, Kategori, Tür) doldurunuz.");
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('tracks')
                .insert([{
                    title: formData.title,
                    category_id: Number(formData.categoryId),
                    genre_id: Number(formData.genreId),
                    bpm: formData.bpm ? Number(formData.bpm) : null,
                    mode: formData.mode
                }]);

            if (error) throw error;

            alert("Eser başarıyla yayınlandı!");
            setFormData({
                title: "",
                categoryId: "",
                genreId: "",
                bpm: "",
                mode: ""
            });
        } catch (error: any) {
            alert("Hata: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Yeni Eser Yükle</h1>
                    <p className="text-slate-400 mt-1">Kütüphaneye yeni ses dosyaları ve meta veriler ekleyin.</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2A3B55] text-slate-300 font-medium transition-colors border border-[#2A3B55]">Taslağı Kaydet</button>
                    <button
                        onClick={handlePublish}
                        disabled={loading}
                        className="px-6 py-2.5 rounded-xl bg-[#ede066] hover:bg-[#d4c95b] text-[#0b1121] font-bold shadow-[0_4px_20px_rgba(237,224,102,0.2)] hover:shadow-[0_4px_30_rgba(237,224,102,0.4)] transition-all flex items-center gap-2 transform active:scale-95 disabled:opacity-50">
                        <span>{loading ? 'Yayınlanıyor...' : 'Eseri Yayınla'}</span>
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
                                <h2 className="text-xl font-bold text-white">Eser Bilgileri</h2>
                            </div>

                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Eser Adı</label>
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
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Kategori</label>
                                    <div className="relative">
                                        <select
                                            name="categoryId"
                                            value={formData.categoryId}
                                            onChange={handleChange}
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 cursor-pointer font-medium">
                                            <option value="">Seçiniz</option>
                                            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                                        </select>
                                        <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Tür</label>
                                    <div className="relative">
                                        <select
                                            name="genreId"
                                            value={formData.genreId}
                                            onChange={handleChange}
                                            disabled={!formData.categoryId}
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium">
                                            <option value="">Seçiniz</option>
                                            {availableGenres.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                        <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">BPM</label>
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
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Mod / Ton</label>
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
                            </div>
                        </div>
                    </div>

                    {/* Right Col */}
                    <div className="xl:col-span-2 space-y-6">
                        <div className="bg-[#151e32] rounded-3xl p-6 md:p-8 border border-[#1e293b] shadow-xl h-full flex flex-col">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 rounded-xl bg-[#0b1121] flex items-center justify-center text-[#ede066] border border-[#2A3B55] shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">Medya Dosyaları</h2>
                                    <p className="text-sm text-slate-400">Yüksek kaliteli ses dosyalarını buraya yükleyin.</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 flex-1">
                                <div className="border-2 border-dashed border-[#2A3B55] bg-[#0b1121]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#ede066] hover:bg-[#0b1121] transition-all cursor-pointer group relative overflow-hidden min-h-[220px]">
                                    <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 group-hover:text-[#ede066] group-hover:scale-110 transition-all mb-4 z-10 border border-[#2A3B55]">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    </div>
                                    <h3 className="font-semibold text-white z-10">Filigranlı Ön İzleme</h3>
                                    <p className="text-xs text-slate-500 mt-2 z-10 max-w-[200px] leading-relaxed">Site üzerinde çalınacak demoyu yükleyin (MP3 - Max 10MB).</p>
                                </div>

                                <div className="border-2 border-dashed border-[#2A3B55] bg-[#0b1121]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#ede066] hover:bg-[#0b1121] transition-all cursor-pointer group relative overflow-hidden min-h-[220px]">
                                    <div className="w-16 h-16 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 group-hover:text-[#ede066] group-hover:scale-110 transition-all mb-4 z-10 border border-[#2A3B55]">
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <h3 className="font-semibold text-white z-10">Master Dosya (Main)</h3>
                                    <p className="text-xs text-slate-500 mt-2 z-10 max-w-[200px] leading-relaxed">Müşteriye iletilecek orijinal WAV/MP3 dosya.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
