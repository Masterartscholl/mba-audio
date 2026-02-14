"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations, useLocale } from 'next-intl';
import logoImg from '@/images/logo.png';

const BPM_MIN = 0;
const BPM_MAX = 300;

interface FilterProps {
    filters: any;
    onFilterChange: (next: any | ((prev: any) => any)) => void;
}

type SidebarData = {
    t: ReturnType<typeof useTranslations<'App'>>;
    locale: string;
    pathname: string;
    genres: any[];
    modes: any[];
    selectedCategory: number | null;
    selectedGenres: number[];
    selectedMode: number | null;
    bpmRange: [number, number];
    priceBounds: [number, number];
    priceRange: [number, number];
    setGenres: React.Dispatch<React.SetStateAction<any[]>>;
    setModes: React.Dispatch<React.SetStateAction<any[]>>;
};

const useSidebarData = (filters: any, onFilterChange: FilterProps['onFilterChange']): SidebarData => {
    const t = useTranslations('App');
    const locale = useLocale();
    const pathname = usePathname();
    const [genres, setGenres] = useState<any[]>([]);
    const [modes, setModes] = useState<any[]>([]);

    const selectedCategory = filters.categoryId ?? null;
    const selectedGenres = filters.genres ?? [];
    const selectedMode = filters.modeId ?? null;
    const bpmRange: [number, number] = filters.bpmRange?.[0] != null ? filters.bpmRange : [BPM_MIN, BPM_MAX];
    const priceBounds: [number, number] = filters.priceBounds?.[0] != null ? filters.priceBounds : [0, 10000];
    const priceRange: [number, number] = filters.priceRange?.[0] != null ? filters.priceRange : [priceBounds[0], priceBounds[1]];

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [modeRes, minPriceRes, maxPriceRes] = await Promise.all([
                    supabase.from('modes').select('*'),
                    supabase
                        .from('tracks')
                        .select('price')
                        .eq('status', 'published')
                        .not('price', 'is', null)
                        .order('price', { ascending: true })
                        .limit(1)
                        .maybeSingle(),
                    supabase
                        .from('tracks')
                        .select('price')
                        .eq('status', 'published')
                        .not('price', 'is', null)
                        .order('price', { ascending: false })
                        .limit(1)
                        .maybeSingle(),
                ]);
                setModes(modeRes.data || []);
                const minP = minPriceRes.data?.price != null ? Number(minPriceRes.data.price) : 0;
                const maxP = maxPriceRes.data?.price != null ? Number(maxPriceRes.data.price) : 10000;
                onFilterChange((prev: any) => ({
                    ...prev,
                    priceBounds: [minP, maxP],
                    priceRange: [minP, maxP],
                    bpmRange: prev.bpmRange ?? [BPM_MIN, BPM_MAX],
                }));
            } catch (err) {
                console.error('Sidebar fetchInitialData error:', err);
            }
        };

        fetchInitialData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            fetchGenres(selectedCategory);
        } else {
            setGenres([]);
        }
    }, [selectedCategory]);

    const fetchGenres = async (catId: number) => {
        try {
            const { data } = await supabase.from('genres').select('*').eq('category_id', catId);
            setGenres(data || []);
        } catch (err) {
            console.error('Genres fetch error:', err);
            setGenres([]);
        }
    };

    return {
        t,
        locale,
        pathname,
        genres,
        modes,
        selectedCategory,
        selectedGenres,
        selectedMode,
        bpmRange,
        priceBounds,
        priceRange,
        setGenres,
        setModes,
    };
};

export const Sidebar: React.FC<FilterProps> = ({ filters, onFilterChange }) => {
    const {
        t,
        locale,
        pathname,
        genres,
        modes,
        selectedCategory,
        selectedGenres,
        selectedMode,
        bpmRange,
        priceBounds,
        priceRange,
    } = useSidebarData(filters, onFilterChange);

    return (
        <aside className="hidden lg:flex w-80 min-w-[18rem] max-w-[20rem] bg-app-bg border-r-2 border-app-border flex-col h-screen sticky top-0 overflow-hidden shrink-0">
            {/* Logo Area */}
            <div className="h-24 flex items-center px-8 border-b border-app-border shrink-0">
                <Link href="/" className="flex items-center gap-3">
                    <Image src={logoImg} alt="MüzikBank" width={32} height={32} className="rounded-lg object-contain" />
                    <div>
                        <h1 className="text-xl font-black text-app-text tracking-tight leading-none">MüzikBank</h1>
                        <p className="text-[10px] font-bold text-app-text-muted tracking-widest uppercase">{t('audioLibrary')}</p>
                    </div>
                </Link>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 space-y-8 pb-32 min-w-0">
                {/* Navigation */}
                <div>
                    <h3 className="text-xs font-black text-app-text-muted tracking-[0.2em] mb-4 pl-2 uppercase">{t('menu')}</h3>
                    <nav className="space-y-1">
                        <Link
                            href="/"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${pathname === '/' ? 'bg-app-surface text-app-primary border-app-border shadow-inner' : 'text-app-text-muted hover:text-app-text hover:bg-app-surface border-transparent'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span>{t('home')}</span>
                        </Link>
                        <Link
                            href="/favorites"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border group ${pathname === '/favorites' ? 'bg-app-surface text-app-primary border-app-border shadow-inner' : 'text-app-text-muted hover:text-app-text hover:bg-app-surface border-transparent'}`}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill={pathname === '/favorites' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            <span>{t('myFavorites')}</span>
                        </Link>
                        <Link
                            href="/library"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border group ${pathname === '/library' ? 'bg-app-surface text-app-primary border-app-border shadow-inner' : 'text-app-text-muted hover:text-app-text hover:bg-app-surface border-transparent'}`}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8m0 0l3-3m-3 3L5 8m0 0h8M5 8V7" /></svg>
                            <span>{t('myLibrary')}</span>
                        </Link>
                    </nav>
                </div>

                <div className="space-y-6 min-w-0">
                    <h3 className="text-xs font-black text-app-text-muted tracking-[0.2em] mb-4 pl-2 uppercase">{t('filters')}</h3>

                    {genres.length > 0 && (
                        <div className="bg-app-card rounded-2xl p-4 border border-app-border">
                            <p className="text-[11px] font-black text-app-text uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-app-primary"></span>
                                {t('genre')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {genres.map((genre) => {
                                    const label = locale === 'en' ? (genre.name_en || genre.name) : genre.name;
                                    return (
                                        <button
                                            key={genre.id}
                                            type="button"
                                            onClick={() => {
                                                const next = selectedGenres.includes(genre.id)
                                                    ? selectedGenres.filter((id: number) => id !== genre.id)
                                                    : [...selectedGenres, genre.id];
                                                onFilterChange({ ...filters, genres: next });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedGenres.includes(genre.id)
                                                ? 'bg-app-primary/20 text-app-primary border-app-primary/40'
                                                : 'bg-app-surface text-app-text-muted border-transparent hover:border-app-border hover:text-app-text hover:bg-app-card'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-app-card rounded-2xl p-4 border border-app-border">
                        <p className="text-[11px] font-black text-app-text uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-app-primary"></span>
                            {t('mood')}
                        </p>
                        <div className="relative">
                            <select
                                value={selectedMode || ''}
                                onChange={(e) => onFilterChange({ ...filters, modeId: e.target.value ? Number(e.target.value) : null })}
                                className="w-full bg-app-input-bg border border-app-border rounded-xl px-4 py-2.5 text-xs text-app-text font-bold appearance-none focus:outline-none focus:border-app-primary/50 transition-all cursor-pointer hover:bg-app-card">
                                <option value="">{t('selectMood')}</option>
                                {(selectedCategory ? modes.filter((m: any) => m.category_id === selectedCategory) : modes).map((mode: any) => {
                                    const label = locale === 'en' ? (mode.name_en || mode.name) : mode.name;
                                    return (
                                        <option key={mode.id} value={mode.id}>{label}</option>
                                    );
                                })}
                            </select>
                            <svg className="w-3.5 h-3.5 text-app-text-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    {/* BPM Range */}
                    <div className="bg-app-card rounded-2xl p-4 border border-app-border min-w-0">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-black text-app-text uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-app-primary"></span>
                                {t('bpm')}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-app-primary bg-app-primary/10 px-2 py-0.5 rounded border border-app-primary/20">{bpmRange[0]} - {bpmRange[1]}</span>
                                {(bpmRange[0] !== BPM_MIN || bpmRange[1] !== BPM_MAX) && (
                                    <button
                                        type="button"
                                        onClick={() => onFilterChange({ ...filters, bpmRange: [BPM_MIN, BPM_MAX] })}
                                        className="text-[9px] font-bold text-app-text-muted hover:text-app-primary uppercase tracking-wider transition-colors"
                                    >
                                        {t('reset')}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 items-center mb-2">
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Min</span>
                                <input
                                    type="number"
                                    min={BPM_MIN}
                                    max={BPM_MAX}
                                    value={bpmRange[0]}
                                    onChange={(e) => {
                                        const v = Math.min(BPM_MAX, Math.max(BPM_MIN, parseInt(e.target.value, 10) || BPM_MIN));
                                        onFilterChange({ ...filters, bpmRange: [v, Math.max(v, bpmRange[1])] });
                                    }}
                                    className="w-full bg-app-input-bg border border-app-border rounded-lg px-3 py-2 text-xs text-app-text font-bold focus:outline-none focus:border-app-primary/50"
                                />
                            </label>
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Max</span>
                                <input
                                    type="number"
                                    min={BPM_MIN}
                                    max={BPM_MAX}
                                    value={bpmRange[1]}
                                    onChange={(e) => {
                                        const v = Math.min(BPM_MAX, Math.max(BPM_MIN, parseInt(e.target.value, 10) || BPM_MAX));
                                        onFilterChange({ ...filters, bpmRange: [Math.min(v, bpmRange[0]), v] });
                                    }}
                                    className="w-full bg-app-input-bg border border-app-border rounded-lg px-3 py-2 text-xs text-app-text font-bold focus:outline-none focus:border-app-primary/50"
                                />
                            </label>
                        </div>
                        <div className="flex gap-3 items-center min-w-0">
                            <input
                                type="range"
                                min={BPM_MIN}
                                max={BPM_MAX}
                                value={bpmRange[0]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    onFilterChange({ ...filters, bpmRange: [v, Math.max(v, bpmRange[1])] });
                                }}
                                className="flex-1 min-w-0 w-0 accent-app-primary h-1.5 bg-app-input-bg rounded-full appearance-none cursor-pointer"
                            />
                            <input
                                type="range"
                                min={BPM_MIN}
                                max={BPM_MAX}
                                value={bpmRange[1]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    onFilterChange({ ...filters, bpmRange: [Math.min(v, bpmRange[0]), v] });
                                }}
                                className="flex-1 min-w-0 w-0 accent-app-primary h-1.5 bg-app-input-bg rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                        <p className="text-[9px] text-app-text-muted mt-1.5">{BPM_MIN} - {BPM_MAX} {t('bpmRangeHint')}</p>
                    </div>

                    {/* Price Range */}
                    <div className="bg-app-card rounded-2xl p-4 border border-app-border min-w-0">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-black text-app-text uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-app-primary"></span>
                                {t('price')}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-app-primary bg-app-primary/10 px-2 py-0.5 rounded border border-app-primary/20">
                                    {priceRange[0].toLocaleString('tr-TR')} - {priceRange[1].toLocaleString('tr-TR')}
                                </span>
                                {(priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]) && (
                                    <button
                                        type="button"
                                        onClick={() => onFilterChange({ ...filters, priceRange: [priceBounds[0], priceBounds[1]] })}
                                        className="text-[9px] font-bold text-app-text-muted hover:text-app-primary uppercase tracking-wider transition-colors"
                                    >
                                        {t('reset')}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 items-center mb-2">
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Min</span>
                                <input
                                    type="number"
                                    min={priceBounds[0]}
                                    max={priceBounds[1]}
                                    value={priceRange[0]}
                                    onChange={(e) => {
                                        const v = Math.min(priceBounds[1], Math.max(priceBounds[0], Number(e.target.value) || priceBounds[0]));
                                        onFilterChange({ ...filters, priceRange: [v, Math.max(v, priceRange[1])] });
                                    }}
                                    className="w-full bg-app-input-bg border border-app-border rounded-lg px-3 py-2 text-xs text-app-text font-bold focus:outline-none focus:border-app-primary/50"
                                />
                            </label>
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Max</span>
                                <input
                                    type="number"
                                    min={priceBounds[0]}
                                    max={priceBounds[1]}
                                    value={priceRange[1]}
                                    onChange={(e) => {
                                        const v = Math.min(priceBounds[1], Math.max(priceBounds[0], Number(e.target.value) || priceBounds[1]));
                                        onFilterChange({ ...filters, priceRange: [Math.min(v, priceRange[0]), v] });
                                    }}
                                    className="w-full bg-app-input-bg border border-app-border rounded-lg px-3 py-2 text-xs text-app-text font-bold focus:outline-none focus:border-app-primary/50"
                                />
                            </label>
                        </div>
                        <div className="flex gap-3 items-center min-w-0">
                            <input
                                type="range"
                                min={priceBounds[0]}
                                max={priceBounds[1]}
                                value={priceRange[0]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    onFilterChange({ ...filters, priceRange: [v, Math.max(v, priceRange[1])] });
                                }}
                                className="flex-1 min-w-0 w-0 accent-[#ede066] h-1.5 bg-[#0a0a0a] rounded-full appearance-none cursor-pointer"
                            />
                            <input
                                type="range"
                                min={priceBounds[0]}
                                max={priceBounds[1]}
                                value={priceRange[1]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    onFilterChange({ ...filters, priceRange: [Math.min(v, priceRange[0]), v] });
                                }}
                                className="flex-1 min-w-0 w-0 accent-[#ede066] h-1.5 bg-[#0a0a0a] rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-app-text-muted mt-2 px-1">
                            <span>{priceBounds[0].toLocaleString('tr-TR')}</span>
                            <span>{priceBounds[1].toLocaleString('tr-TR')}</span>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => onFilterChange({
                            ...filters,
                            categoryId: null,
                            genres: [],
                            modeId: null,
                            bpmRange: [BPM_MIN, BPM_MAX],
                            priceRange: [priceBounds[0], priceBounds[1]],
                        })}
                        className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-wider border border-app-border text-app-text-muted hover:text-app-primary hover:border-app-primary/30 hover:bg-app-surface transition-all"
                    >
                        {t('resetFiltering')}
                    </button>
                </div>
            </div>
        </aside>
    );
};

type SidebarMobileDrawerProps = FilterProps & {
    onClose?: () => void;
};

export const SidebarMobileDrawer: React.FC<SidebarMobileDrawerProps> = ({ filters, onFilterChange, onClose }) => {
    const {
        t,
        locale,
        pathname,
        genres,
        modes,
        selectedCategory,
        selectedGenres,
        selectedMode,
        bpmRange,
        priceBounds,
        priceRange,
    } = useSidebarData(filters, onFilterChange);

    return (
        <div className="flex h-full flex-col bg-app-bg border-r border-app-border">
            {/* Logo + Close - mobile */}
            <div className="h-16 flex items-center justify-between px-5 border-b border-app-border shrink-0">
                <Link href="/" className="flex items-center gap-3" onClick={onClose}>
                    <Image src={logoImg} alt="MüzikBank" width={28} height={28} className="rounded-lg object-contain" />
                    <div>
                        <h1 className="text-lg font-black text-app-text tracking-tight leading-none">MüzikBank</h1>
                        <p className="text-[9px] font-bold text-app-text-muted tracking-widest uppercase">{t('audioLibrary')}</p>
                    </div>
                </Link>
                <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted hover:text-app-text hover:border-app-primary/40 transition-all"
                    aria-label={t('close')}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 space-y-5 min-w-0">
                {/* Navigation */}
                <div>
                    <h3 className="text-[11px] font-black text-app-text-muted tracking-[0.2em] mb-3 pl-1 uppercase">{t('menu')}</h3>
                    <nav className="space-y-1">
                        <Link
                            href="/"
                            onClick={onClose}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all border ${pathname === '/' ? 'bg-app-surface text-app-primary border-app-border shadow-inner' : 'text-app-text-muted hover:text-app-text hover:bg-app-surface border-transparent'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span>{t('home')}</span>
                        </Link>
                        <Link
                            href="/favorites"
                            onClick={onClose}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all border group ${pathname === '/favorites' ? 'bg-app-surface text-app-primary border-app-border shadow-inner' : 'text-app-text-muted hover:text-app-text hover:bg-app-surface border-transparent'}`}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill={pathname === '/favorites' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            <span>{t('myFavorites')}</span>
                        </Link>
                        <Link
                            href="/library"
                            onClick={onClose}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all border group ${pathname === '/library' ? 'bg-app-surface text-app-primary border-app-border shadow-inner' : 'text-app-text-muted hover:text-app-text hover:bg-app-surface border-transparent'}`}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8m0 0l3-3m-3 3L5 8m0 0h8M5 8V7" /></svg>
                            <span>{t('myLibrary')}</span>
                        </Link>
                    </nav>
                </div>

                <div className="space-y-5 min-w-0">
                    <h3 className="text-[11px] font-black text-app-text-muted tracking-[0.2em] mb-2 pl-1 uppercase">{t('filters')}</h3>

                    {genres.length > 0 && (
                        <div className="bg-app-card rounded-2xl p-3 border border-app-border">
                            <p className="text-[11px] font-black text-app-text uppercase tracking-wider mb-2 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-app-primary"></span>
                                {t('genre')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {genres.map((genre) => {
                                    const label = locale === 'en' ? (genre.name_en || genre.name) : genre.name;
                                    return (
                                        <button
                                            key={genre.id}
                                            type="button"
                                            onClick={() => {
                                                const next = selectedGenres.includes(genre.id)
                                                    ? selectedGenres.filter((id: number) => id !== genre.id)
                                                    : [...selectedGenres, genre.id];
                                                onFilterChange({ ...filters, genres: next });
                                            }}
                                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedGenres.includes(genre.id)
                                                ? 'bg-app-primary/20 text-app-primary border-app-primary/40'
                                                : 'bg-app-surface text-app-text-muted border-transparent hover:border-app-border hover:text-app-text hover:bg-app-card'
                                                }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <div className="bg-app-card rounded-2xl p-3 border border-app-border">
                        <p className="text-[11px] font-black text-app-text uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-app-primary"></span>
                            {t('mood')}
                        </p>
                        <div className="relative">
                            <select
                                value={selectedMode || ''}
                                onChange={(e) => onFilterChange({ ...filters, modeId: e.target.value ? Number(e.target.value) : null })}
                                className="w-full bg-app-input-bg border border-app-border rounded-xl px-3 py-2 text-xs text-app-text font-bold appearance-none focus:outline-none focus:border-app-primary/50 transition-all cursor-pointer hover:bg-app-card">
                                <option value="">{t('selectMood')}</option>
                                {(selectedCategory ? modes.filter((m: any) => m.category_id === selectedCategory) : modes).map((mode: any) => {
                                    const label = locale === 'en' ? (mode.name_en || mode.name) : mode.name;
                                    return (
                                        <option key={mode.id} value={mode.id}>{label}</option>
                                    );
                                })}
                            </select>
                            <svg className="w-3.5 h-3.5 text-app-text-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    {/* BPM Range */}
                    <div className="bg-app-card rounded-2xl p-3 border border-app-border min-w-0">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[11px] font-black text-app-text uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-app-primary"></span>
                                {t('bpm')}
                            </p>
                            <span className="text-[10px] font-black text-app-primary bg-app-primary/10 px-2 py-0.5 rounded border border-app-primary/20">
                                {bpmRange[0]} - {bpmRange[1]}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center mb-2">
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Min</span>
                                <input
                                    type="number"
                                    min={BPM_MIN}
                                    max={BPM_MAX}
                                    value={bpmRange[0]}
                                    onChange={(e) => {
                                        const v = Math.min(BPM_MAX, Math.max(BPM_MIN, parseInt(e.target.value, 10) || BPM_MIN));
                                        onFilterChange({ ...filters, bpmRange: [v, Math.max(v, bpmRange[1])] });
                                    }}
                                    className="w-full bg-app-input-bg border border-app-border rounded-lg px-3 py-2 text-xs text-app-text font-bold focus:outline-none focus:border-app-primary/50"
                                />
                            </label>
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Max</span>
                                <input
                                    type="number"
                                    min={BPM_MIN}
                                    max={BPM_MAX}
                                    value={bpmRange[1]}
                                    onChange={(e) => {
                                        const v = Math.min(BPM_MAX, Math.max(BPM_MIN, parseInt(e.target.value, 10) || BPM_MAX));
                                        onFilterChange({ ...filters, bpmRange: [Math.min(v, bpmRange[0]), v] });
                                    }}
                                    className="w-full bg-app-input-bg border border-app-border rounded-lg px-3 py-2 text-xs text-app-text font-bold focus:outline-none focus:border-app-primary/50"
                                />
                            </label>
                        </div>
                        <div className="flex gap-3 items-center min-w-0">
                            <input
                                type="range"
                                min={BPM_MIN}
                                max={BPM_MAX}
                                value={bpmRange[0]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    onFilterChange({ ...filters, bpmRange: [v, Math.max(v, bpmRange[1])] });
                                }}
                                className="flex-1 min-w-0 w-0 accent-app-primary h-1.5 bg-app-input-bg rounded-full appearance-none cursor-pointer"
                            />
                            <input
                                type="range"
                                min={BPM_MIN}
                                max={BPM_MAX}
                                value={bpmRange[1]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    onFilterChange({ ...filters, bpmRange: [Math.min(v, bpmRange[0]), v] });
                                }}
                                className="flex-1 min-w-0 w-0 accent-app-primary h-1.5 bg-app-input-bg rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                        <p className="text-[9px] text-app-text-muted mt-1.5">{BPM_MIN} - {BPM_MAX} {t('bpmRangeHint')}</p>
                    </div>

                    {/* Price Range */}
                    <div className="bg-app-card rounded-2xl p-3 border border-app-border min-w-0">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-[11px] font-black text-app-text uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-app-primary"></span>
                                {t('price')}
                            </p>
                            <span className="text-[10px] font-black text-app-primary bg-app-primary/10 px-2 py-0.5 rounded border border-app-primary/20">
                                {priceRange[0].toLocaleString('tr-TR')} - {priceRange[1].toLocaleString('tr-TR')}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center mb-2">
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Min</span>
                                <input
                                    type="number"
                                    min={priceBounds[0]}
                                    max={priceBounds[1]}
                                    value={priceRange[0]}
                                    onChange={(e) => {
                                        const v = Math.min(priceBounds[1], Math.max(priceBounds[0], Number(e.target.value) || priceBounds[0]));
                                        onFilterChange({ ...filters, priceRange: [v, Math.max(v, priceRange[1])] });
                                    }}
                                    className="w-full bg-app-input-bg border border-app-border rounded-lg px-3 py-2 text-xs text-app-text font-bold focus:outline-none focus:border-app-primary/50"
                                />
                            </label>
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-app-text-muted uppercase tracking-wider">Max</span>
                                <input
                                    type="number"
                                    min={priceBounds[0]}
                                    max={priceBounds[1]}
                                    value={priceRange[1]}
                                    onChange={(e) => {
                                        const v = Math.min(priceBounds[1], Math.max(priceBounds[0], Number(e.target.value) || priceBounds[1]));
                                        onFilterChange({ ...filters, priceRange: [Math.min(v, priceRange[0]), v] });
                                    }}
                                    className="w-full bg-app-input-bg border border-app-border rounded-lg px-3 py-2 text-xs text-app-text font-bold focus:outline-none focus:border-app-primary/50"
                                />
                            </label>
                        </div>
                        <div className="flex gap-3 items-center min-w-0">
                            <input
                                type="range"
                                min={priceBounds[0]}
                                max={priceBounds[1]}
                                value={priceRange[0]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    onFilterChange({ ...filters, priceRange: [v, Math.max(v, priceRange[1])] });
                                }}
                                className="flex-1 min-w-0 w-0 accent-[#ede066] h-1.5 bg-[#0a0a0a] rounded-full appearance-none cursor-pointer"
                            />
                            <input
                                type="range"
                                min={priceBounds[0]}
                                max={priceBounds[1]}
                                value={priceRange[1]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    onFilterChange({ ...filters, priceRange: [Math.min(v, priceRange[0]), v] });
                                }}
                                className="flex-1 min-w-0 w-0 accent-[#ede066] h-1.5 bg-[#0a0a0a] rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-app-text-muted mt-2 px-1">
                            <span>{priceBounds[0].toLocaleString('tr-TR')}</span>
                            <span>{priceBounds[1].toLocaleString('tr-TR')}</span>
                        </div>
                        <p className="text-[9px] text-app-text-muted mt-1.5">{t('priceRangeHint')}</p>
                    </div>
                </div>
            </div>

            <div className="h-16 shrink-0 border-t border-app-border px-4 flex items-center justify-between bg-app-bg/95 backdrop-blur-md">
                <div>
                    <p className="text-[9px] font-black text-app-text-muted uppercase tracking-[0.2em] mb-0.5">{t('support')}</p>
                    <p className="text-[11px] font-bold text-app-text">support@musicbank.com</p>
                </div>
                <p className="text-[10px] font-bold text-app-text-muted uppercase tracking-[0.2em]">
                    MBA AUDIO
                </p>
            </div>
        </div>
    );
}
