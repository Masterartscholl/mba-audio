"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { supabase } from '@/lib/supabase';

interface CategoryBarProps {
    filters: { categoryId?: number | null; genres?: number[]; modeId?: number | null };
    onFilterChange: (next: (prev: any) => any) => void;
    onCategoryNameChange?: (name: string | null) => void;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ filters, onFilterChange, onCategoryNameChange }) => {
    const t = useTranslations('App');
    const locale = useLocale();
    const [categories, setCategories] = useState<{ id: number; name: string; name_en?: string }[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase.from('categories').select('id, name, name_en').order('name');
            if (error) {
                console.error('Categories fetch error:', error);
            }
            setCategories((data as { id: number; name: string }[]) || []);
        } catch (err) {
            console.error('Categories fetch failed:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const selectedCategoryId = filters.categoryId ?? null;
    const hasActiveFilter = selectedCategoryId != null || (filters.genres?.length ?? 0) > 0 || filters.modeId != null;

    const handleCategoryClick = (id: number) => {
        const nextId = selectedCategoryId === id ? null : id;
        const cat = nextId != null ? categories.find((c) => c.id === nextId) : null;
        const baseName = cat ? (locale === 'en' ? (cat.name_en || cat.name) : cat.name) : null;
        const nextName = baseName ?? null;
        if (onCategoryNameChange) {
            onCategoryNameChange(nextName);
        }
        onFilterChange(prev => ({
            ...prev,
            categoryId: nextId,
            genres: [],
            modeId: null
        }));
    };

    const handleReset = () => {
        if (onCategoryNameChange) {
            onCategoryNameChange(null);
        }
        onFilterChange(prev => ({
            ...prev,
            categoryId: null,
            genres: [],
            modeId: null
        }));
    };

    return (
        <div className="px-4 lg:px-10 pt-4 lg:pt-6 pb-2 lg:pb-4 border-b border-app-border bg-app-bg/90 shrink-0 overflow-x-auto no-scrollbar">
            <div className="flex flex-nowrap lg:flex-wrap items-center gap-2 lg:gap-3 min-w-max lg:min-w-0">
                <span className="text-[10px] lg:text-[11px] font-black text-[#ede066] uppercase tracking-wider mr-1 sticky left-0 bg-app-bg/90 lg:static z-10 py-2">
                    {t('categories')}
                </span>
                {loading ? (
                    <>
                        <span className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-app-surface/50 text-app-text-muted animate-pulse w-24" />
                        <span className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-app-surface/50 text-app-text-muted animate-pulse w-28" />
                        <span className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-app-surface/50 text-app-text-muted animate-pulse w-32" />
                    </>
                ) : (
                    categories.map(cat => {
                        const label = locale === 'en' ? (cat.name_en || cat.name) : cat.name;
                        return (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => handleCategoryClick(cat.id)}
                                className={`px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${selectedCategoryId === cat.id
                                    ? 'bg-app-primary text-app-primary-foreground shadow-lg shadow-app-primary/25'
                                    : 'bg-app-surface text-app-text-muted border border-app-border hover:bg-app-card hover:text-app-text hover:border-app-border'
                                    }`}
                            >
                                {label}
                            </button>
                        );
                    })
                )}
                {hasActiveFilter && (
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-3 lg:px-4 py-1.5 lg:py-2 rounded-xl text-[10px] lg:text-xs font-bold uppercase tracking-wider bg-app-surface text-app-text-muted border border-app-border hover:bg-app-card hover:text-app-primary hover:border-app-primary/30 transition-all whitespace-nowrap"
                    >
                        {t('resetFiltering')}
                    </button>
                )}
            </div>
        </div>
    );
};
