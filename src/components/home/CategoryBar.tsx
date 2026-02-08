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
        <div className="px-10 pt-6 pb-4 border-b border-app-border bg-app-bg/90 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
                <span className="text-[11px] font-black text-app-text-muted uppercase tracking-wider mr-1">
                    {t('categories')}
                </span>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        type="button"
                        onClick={() => handleCategoryClick(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${selectedCategoryId === cat.id
                            ? 'bg-app-primary text-app-primary-foreground shadow-lg shadow-app-primary/25'
                            : 'bg-app-surface text-app-text-muted border border-app-border hover:bg-app-card hover:text-app-text hover:border-app-border'
                            }`}
                    >
                        {cat.name}
                    </button>
                ))}
                {hasActiveFilter && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-app-surface text-app-text-muted border border-app-border hover:bg-app-card hover:text-app-primary hover:border-app-primary/30 transition-all"
                    >
                        {t('resetFiltering')}
                    </button>
                )}
            </div>
        </div>
    );
};
