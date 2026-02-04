"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Types
type Category = {
    id: number;
    name: string;
};

type Genre = {
    id: number;
    name: string;
    category_id: number;
};

// --- Quick Add Modal (Generic) ---
const QuickAddModal = ({
    isOpen,
    onClose,
    type,
    categoryId,
    onSuccess
}: {
    isOpen: boolean;
    onClose: () => void;
    type: 'category' | 'genre';
    categoryId?: string | number;
    onSuccess: () => void;
}) => {
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!name) return;
        if (type === 'genre' && !categoryId) return; // Genree needs category

        setLoading(true);
        try {
            let error;
            if (type === 'category') {
                const res = await supabase.from('categories').insert([{ name }]);
                error = res.error;
            } else {
                const res = await supabase.from('genres').insert([{ name, category_id: Number(categoryId) }]);
                error = res.error;
            }

            if (error) throw error;
            onSuccess();
            setName("");
            onClose();
        } catch (error: any) {
            alert("Hata: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const title = type === 'category' ? 'Yeni Kategori Ekle' : 'Yeni Tür Ekle';
    const placeholder = type === 'category' ? 'Kategori Adı...' : 'Tür Adı...';

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-[#151e32] border border-[#2A3B55] w-full max-w-sm rounded-2xl shadow-2xl p-6">
                <h3 className="text-white font-bold text-lg mb-4">{title}</h3>
                <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3 text-white focus:border-[#ede066] mb-4 outline-none"
                    placeholder={placeholder}
                />
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 text-slate-400 hover:text-white bg-[#0b1121] rounded-xl font-medium transition-colors">İptal</button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !name}
                        className="flex-1 py-3 bg-[#ede066] text-black font-bold rounded-xl hover:bg-[#d4c95b] transition-all disabled:opacity-50"
                    >
                        {loading ? "..." : "Kaydet"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Skeleton Loader Component ---
const SkeletonLoader = () => (
    <div className="animate-pulse space-y-4">
        <div className="h-12 bg-[#1e293b] rounded-xl w-full"></div>
        <div className="h-12 bg-[#1e293b] rounded-xl w-full"></div>
        <div className="h-48 bg-[#1e293b] rounded-xl w-full"></div>
    </div>
);


export default function AdminPage() {
    const [activeView, setActiveView] = useState<'upload' | 'management'>('upload');

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

    // Quick Add State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'category' | 'genre'>('genre');
    const [activeCategoryId, setActiveCategoryId] = useState<number | string>("");

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

    const openAddCategory = () => {
        setModalType('category');
        setIsModalOpen(true);
    };

    const openAddGenre = (catId: number | string) => {
        setModalType('genre');
        setActiveCategoryId(catId);
        setIsModalOpen(true);
    };

    const handleSuccess = async () => {
        await fetchData(); // Refresh all data
    };

    const handleDeleteGenre = async (id: number) => {
        if (!confirm("Bu türü silmek istediğinize emin misiniz?")) return;
        const { error } = await supabase.from('genres').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm("Bu kategoriyi ve bağlı tüm türleri silmek istediğinize emin misiniz?")) return;
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (!error) fetchData();
    };

    return (
        <div className="min-h-screen bg-[#0b1121] text-white font-sans flex antialiased">

            {/* Quick Add Modal */}
            <QuickAddModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type={modalType}
                categoryId={activeCategoryId}
                onSuccess={handleSuccess}
            />

            {/* Sidebar Navigation */}
            <aside className="w-64 bg-[#0f172a] border-r border-[#1e293b] flex-col hidden md:flex sticky top-0 h-screen shrink-0">
                <div className="p-8">
                    <div className="flex items-center gap-3 text-[#ede066]">
                        <div className="w-8 h-8 rounded-full bg-[#ede066] flex items-center justify-center shadow-[0_0_15px_rgba(237,224,102,0.4)]">
                            <svg className="w-5 h-5 text-[#0b1121]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                        </div>
                        <span className="font-bold text-lg tracking-wide">MBA AUDIO</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <button
                        onClick={() => setActiveView('upload')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeView === 'upload' ? 'bg-[#ede066]/10 text-[#ede066] border border-[#ede066]/20' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        <span className="font-medium">Dashboard</span>
                    </button>
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-gray-400 hover:text-white hover:bg-[#1e293b]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        <span className="font-medium">Kütüphane</span>
                    </button>
                    <button
                        onClick={() => setActiveView('management')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${activeView === 'management' ? 'bg-[#ede066]/10 text-[#ede066] border border-[#ede066]/20' : 'text-gray-400 hover:text-white hover:bg-[#1e293b]'}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                        <span className="font-medium">Kategori & Tür</span>
                    </button>
                    <button
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left text-gray-400 hover:text-white hover:bg-[#1e293b]">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="font-medium">Ayarlar</span>
                    </button>
                </nav>

                <div className="p-6 border-t border-[#1e293b]">
                    <div className="flex items-center gap-3 p-3 bg-[#0b1121]/50 rounded-xl border border-[#2A3B55]">
                        <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center text-[#ede066] font-bold border border-[#2A3B55]">A</div>
                        <div>
                            <h4 className="text-sm font-semibold text-white">Admin User</h4>
                            <p className="text-xs text-gray-500">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto w-full">
                <div className="max-w-6xl mx-auto space-y-10">

                    {activeView === 'upload' ? (
                        // --- Upload View ---
                        <>
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Yeni Eser Yükle</h1>
                                    <p className="text-slate-400 mt-1">Kütüphaneye yeni ses dosyaları ve meta veriler ekleyin.</p>
                                </div>
                                <div className="flex gap-3">
                                    <button className="px-5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2A3B55] text-slate-300 font-medium transition-colors border border-[#2A3B55]">Taslağı Kaydet</button>
                                    <button onClick={() => console.log(formData)} className="px-6 py-2.5 rounded-xl bg-[#ede066] hover:bg-[#d4c95b] text-[#0b1121] font-bold shadow-[0_4px_20px_rgba(237,224,102,0.2)] hover:shadow-[0_4px_30px_rgba(237,224,102,0.4)] transition-all flex items-center gap-2 transform active:scale-95">
                                        <span>Eseri Yayınla</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                    </button>
                                </div>
                            </div>

                            {loading ? <SkeletonLoader /> : (
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

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="space-y-2 col-span-2 sm:col-span-1">
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
                                                    <div className="space-y-2 col-span-2 sm:col-span-1">
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
                    ) : (
                        // --- Management View ---
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Kategori & Tür Yönetimi</h1>
                                    <p className="text-slate-400 mt-1">Sistemdeki kategorileri ve bağlı türleri buradan yönetebilirsiniz.</p>
                                </div>
                                <button
                                    onClick={openAddCategory}
                                    className="px-5 py-2.5 bg-[#ede066] hover:bg-[#d4c95b] text-[#0b1121] font-bold rounded-xl flex items-center gap-2 transform active:scale-95 transition-all shadow-lg shadow-[#ede066]/10">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                                    Yeni Kategori
                                </button>
                            </div>

                            {loading ? <SkeletonLoader /> : (
                                <div className="bg-[#151e32] rounded-3xl border border-[#1e293b] overflow-hidden shadow-xl">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#0b1121] border-b border-[#1e293b] text-slate-400 text-xs uppercase font-bold tracking-wider">
                                                <tr>
                                                    <th className="px-8 py-5 w-1/4">KATEGORİ ADI</th>
                                                    <th className="px-8 py-5 w-3/4">BAĞLI TÜRLER</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-[#1e293b]">
                                                {categories.map(cat => {
                                                    const catGenres = genres.filter(g => g.category_id === cat.id);
                                                    return (
                                                        <tr key={cat.id} className="hover:bg-[#1e293b]/30 transition-colors group/row">
                                                            <td className="px-8 py-6 align-top">
                                                                <div className="flex items-center justify-between">
                                                                    <div>
                                                                        <div className="font-bold text-white text-lg">{cat.name}</div>
                                                                        <div className="text-xs text-slate-500 mt-1">{catGenres.length} Tür</div>
                                                                    </div>
                                                                    <button
                                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                                        className="text-slate-600 hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity p-2" title="Kategoriyi Sil">
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-6">
                                                                <div className="flex flex-wrap gap-2 items-start">
                                                                    {catGenres.length > 0 ? catGenres.map(g => (
                                                                        <span key={g.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0b1121] border border-[#2A3B55] text-sm text-slate-300 group hover:border-[#ede066]/50 transition-all">
                                                                            {g.name}
                                                                            <button
                                                                                onClick={() => handleDeleteGenre(g.id)}
                                                                                className="text-slate-600 hover:text-red-400 transition-colors p-0.5" title="Sil">
                                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                                            </button>
                                                                        </span>
                                                                    )) : (
                                                                        <span className="text-slate-600 italic text-sm py-1.5">Henüz bağlı tür yok.</span>
                                                                    )}

                                                                    {/* Add Genre Button specific to category */}
                                                                    <button
                                                                        onClick={() => openAddGenre(cat.id)}
                                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-[#ede066]/50 text-sm text-[#ede066] hover:bg-[#ede066]/10 transition-all font-medium"
                                                                        title="Yeni Tür Ekle">
                                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                                        Ekle
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
