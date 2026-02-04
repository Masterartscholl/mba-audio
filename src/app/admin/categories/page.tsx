"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { QuickAddModal } from '@/components/admin/QuickAddModal';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { useTranslations } from 'next-intl';

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
    const t = useTranslations('Categories');
    const tc = useTranslations('Common');
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
        if (!confirm(t('deleteConfirm'))) return;
        const { error } = await supabase.from('genres').delete().eq('id', id);
        if (!error) fetchData();
    };

    const handleDeleteCategory = async (id: number) => {
        if (!confirm(t('deleteConfirm'))) return;
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
                    <h1 className="text-3xl font-bold text-admin-text tracking-tight">{t('title')}</h1>
                    <p className="text-admin-text-muted mt-1">{t('categories')} & {t('genres')}</p>
                </div>
                <button
                    onClick={openAddCategory}
                    className="px-5 py-2.5 bg-admin-primary hover:bg-admin-primary/90 text-admin-bg font-bold rounded-xl flex items-center gap-2 transform active:scale-95 transition-all shadow-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                    {t('addCategory')}
                </button>
            </div>

            {loading ? <SkeletonLoader /> : (
                <div className="bg-admin-card rounded-3xl border border-admin-border overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-admin-bg border-b border-admin-border text-admin-text-muted text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-8 py-5 w-1/4">{t('table.name')}</th>
                                    <th className="px-8 py-5 w-3/4">{t('genres')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin-border">
                                {categories.map(cat => {
                                    const catGenres = genres.filter(g => g.category_id === cat.id);
                                    return (
                                        <tr key={cat.id} className="hover:bg-admin-bg/30 transition-colors group/row">
                                            <td className="px-8 py-6 align-top">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <div className="font-bold text-admin-text text-lg">{cat.name}</div>
                                                        <div className="text-xs text-admin-text-muted mt-1">{catGenres.length} {t('genres')}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteCategory(cat.id)}
                                                        className="text-admin-text-muted hover:text-red-400 opacity-0 group-hover/row:opacity-100 transition-opacity p-2" title="Kategoriyi Sil">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-wrap gap-2 items-start">
                                                    {catGenres.length > 0 ? catGenres.map(g => (
                                                        <span key={g.id} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-admin-bg border border-admin-border text-sm text-admin-text-muted group hover:border-admin-primary/50 transition-all">
                                                            {g.name}
                                                            <button
                                                                onClick={() => handleDeleteGenre(g.id)}
                                                                className="text-admin-text-muted hover:text-red-400 transition-colors p-0.5" title="Sil">
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                            </button>
                                                        </span>
                                                    )) : (
                                                        <span className="text-admin-text-muted italic text-sm py-1.5">{t('emptyGenres')}</span>
                                                    )}

                                                    <button
                                                        onClick={() => openAddGenre(cat.id)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-dashed border-admin-primary/50 text-sm text-admin-primary hover:bg-admin-primary/10 transition-all font-medium"
                                                        title={t('addGenre')}>
                                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                                                        {t('add')}
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
