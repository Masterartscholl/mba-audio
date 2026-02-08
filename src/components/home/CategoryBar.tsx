"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';

interface CategoryBarProps {
    filters: { categoryId?: number | null; genres?: number[]; modeId?: number | null };
    onFilterChange: (next: (prev: any) => any) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ filters, onFilterChange }) => {
    const t = useTranslations('App');
    const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);

    useEffect(() => {
        const run = async () => {
            const { data } = await supabase.from('categories').select('id, name').order('name');
            setCategories((data as { id: number; name: string }[]) || []);
        };
        run();
    }, []);

    const selectedCategoryId = filters.categoryId ?? null;
    const hasActiveFilter = selectedCategoryId != null || (filters.genres?.length ?? 0) > 0 || filters.modeId != null;

    const handleCategoryClick = (id: number) => {
        const nextId = selectedCategoryId === id ? null : id;
        onFilterChange(prev => ({
            ...prev,
            categoryId: nextId,
            genres: [],
            modeId: null
        }));
    };

    const handleReset = () => {
        onFilterChange(prev => ({
            ...prev,
            categoryId: null,
            genres: [],
            modeId: null
        }));
    };

    return (
        <div className="px-10 pt-6 pb-4 border-b border-white/5 bg-[#0b1121]/80 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-black text-[#64748b] uppercase tracking-wider mr-1">
                    {t('categories')}
                </span>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${selectedCategoryId === cat.id
                            ? 'bg-[#ede066] text-[#0b1121] shadow-lg shadow-[#ede066]/25'
                            : 'bg-white/5 text-[#94a3b8] border border-white/10 hover:bg-white/10 hover:text-white hover:border-white/20'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
                {hasActiveFilter && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 text-[#64748b] border border-white/10 hover:bg-white/10 hover:text-[#ede066] hover:border-[#ede066]/30 transition-all"
                    >
                        {t('resetFiltering')}
                    </button>
                )}
            </div>
        </div>
    );
};
