"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { QuickAddModal } from '@/components/admin/QuickAddModal';
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

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [genres, setGenres] = useState<Genre[]>([]);
    const [loading, setLoading] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'category' | 'genre'>('genre');
    const [activeCategoryId, setActiveCategoryId] = useState<number | string>("");

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

    const openAddCategory = () => {
        setModalType('category');
        setIsModalOpen(true);
    };

    const openAddGenre = (catId: number | string) => {
        setModalType('genre');
        setActiveCategoryId(catId);
        setIsModalOpen(true);
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
        <div className="space-y-6">
            <QuickAddModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type={modalType}
                categoryId={activeCategoryId}
                onSuccess={fetchData}
            />

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
    );
}
