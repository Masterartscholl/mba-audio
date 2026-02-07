"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

interface FilterProps {
    onFilterChange: (filters: any) => void;
}

export const Sidebar: React.FC<FilterProps> = ({ onFilterChange }) => {
    const t = useTranslations('App');
    const pathname = usePathname();
    const [categories, setCategories] = useState<any[]>([]);
    const [genres, setGenres] = useState<any[]>([]);
    const [modes, setModes] = useState<any[]>([]);

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const [selectedMode, setSelectedMode] = useState<number | null>(null);
    const BPM_MIN = 0;
    const BPM_MAX = 300;
    const [bpmRange, setBpmRange] = useState<[number, number]>([BPM_MIN, BPM_MAX]);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
    const [priceBounds, setPriceBounds] = useState<[number, number]>([0, 10000]);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const [catRes, modeRes, minPriceRes, maxPriceRes] = await Promise.all([
            supabase.from('categories').select('*'),
            supabase.from('modes').select('*'),
            supabase.from('tracks').select('price').eq('status', 'published').not('price', 'is', null).order('price', { ascending: true }).limit(1).maybeSingle(),
            supabase.from('tracks').select('price').eq('status', 'published').not('price', 'is', null).order('price', { ascending: false }).limit(1).maybeSingle()
        ]);
        setCategories(catRes.data || []);
        setModes(modeRes.data || []);
        const minP = minPriceRes.data?.price != null ? Number(minPriceRes.data.price) : 0;
        const maxP = maxPriceRes.data?.price != null ? Number(maxPriceRes.data.price) : 10000;
        setPriceBounds([minP, maxP]);
        setPriceRange([minP, maxP]);
    };

    useEffect(() => {
        if (selectedCategory) {
            fetchGenres(selectedCategory);
        } else {
            setGenres([]);
        }
        setSelectedGenres([]);
        setSelectedMode(null);
    }, [selectedCategory]);

    const fetchGenres = async (catId: number) => {
        const { data } = await supabase.from('genres').select('*').eq('category_id', catId);
        setGenres(data || []);
    };

    const handleFilterUpdate = () => {
        onFilterChange({
            categoryId: selectedCategory,
            genres: selectedGenres,
            modeId: selectedMode,
            bpmRange,
            priceRange,
            priceBounds
        });
    };

    useEffect(() => {
        handleFilterUpdate();
    }, [
        selectedCategory,
        selectedGenres.join(','),
        selectedMode,
        bpmRange[0],
        bpmRange[1],
        priceRange[0],
        priceRange[1],
        priceBounds[0],
        priceBounds[1]
    ]);

    return (
        <aside className="w-80 min-w-[18rem] max-w-[20rem] bg-[#0b1121] border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-hidden shrink-0">
            {/* Logo Area */}
            <div className="h-24 flex items-center px-8 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ede066] flex items-center justify-center shadow-[0_0_15px_rgba(237,224,102,0.3)]">
                        <svg className="w-5 h-5 text-[#0b1121]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none">MüzikBank</h1>
                        <p className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase">{t('audioLibrary')}</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-6 space-y-8 pb-32 min-w-0">
                {/* Navigation */}
                <div>
                    <h3 className="text-xs font-black text-[#64748b] tracking-[0.2em] mb-4 pl-2 uppercase">{t('menu')}</h3>
                    <nav className="space-y-1">
                        <Link
                            href="/"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border ${pathname === '/' ? 'bg-white/5 text-[#ede066] border-white/5 shadow-inner' : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border-transparent'}`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span>{t('home')}</span>
                        </Link>
                        <Link
                            href="/favorites"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border group ${pathname === '/favorites' ? 'bg-white/5 text-[#ede066] border-white/5 shadow-inner' : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border-transparent'}`}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill={pathname === '/favorites' ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                            <span>{t('myFavorites')}</span>
                        </Link>
                        <Link
                            href="/library"
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all border group ${pathname === '/library' ? 'bg-white/5 text-[#ede066] border-white/5 shadow-inner' : 'text-[#94a3b8] hover:text-white hover:bg-white/5 border-transparent'}`}
                        >
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8m0 0l3-3m-3 3L5 8m0 0h8M5 8V7" /></svg>
                            <span>{t('myLibrary')}</span>
                        </Link>
                    </nav>
                </div>

                <div className="space-y-6 min-w-0">
                    <h3 className="text-xs font-black text-[#64748b] tracking-[0.2em] mb-4 pl-2 uppercase">{t('filters')}</h3>

                    <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5 min-w-0">
                        <p className="text-[11px] font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                            {t('category')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {categories.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedCategory === cat.id
                                        ? 'bg-[#3b82f6] text-white border-[#3b82f6] shadow-lg shadow-blue-500/20'
                                        : 'bg-[#1e293b]/50 text-[#94a3b8] border-transparent hover:border-white/10 hover:text-white hover:bg-[#1e293b]'
                                        }`}>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {genres.length > 0 && (
                        <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5">
                            <p className="text-[11px] font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                                {t('genre')}
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {genres.map(genre => (
                                    <button
                                        key={genre.id}
                                        type="button"
                                        onClick={() => setSelectedGenres(prev => prev.includes(genre.id) ? prev.filter(id => id !== genre.id) : [...prev, genre.id])}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${selectedGenres.includes(genre.id)
                                            ? 'bg-[#ede066]/20 text-[#ede066] border-[#ede066]/40'
                                            : 'bg-[#1e293b]/50 text-[#94a3b8] border-transparent hover:border-white/10 hover:text-white hover:bg-[#1e293b]'
                                            }`}>
                                        {genre.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5">
                        <p className="text-[11px] font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                            {t('mood')}
                        </p>
                        <div className="relative">
                            <select
                                value={selectedMode || ''}
                                onChange={(e) => setSelectedMode(e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold appearance-none focus:outline-none focus:border-[#ede066]/50 transition-all cursor-pointer hover:bg-[#0f172a]">
                                <option value="">{t('selectMood')}</option>
                                {(selectedCategory ? modes.filter((m: any) => m.category_id === selectedCategory) : modes).map((mode: any) => (
                                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                                ))}
                            </select>
                            <svg className="w-3.5 h-3.5 text-[#64748b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    {/* BPM Range */}
                    <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5 min-w-0">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                                {t('bpm')}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#ede066] bg-[#ede066]/10 px-2 py-0.5 rounded border border-[#ede066]/20">{bpmRange[0]} - {bpmRange[1]}</span>
                                {(bpmRange[0] !== BPM_MIN || bpmRange[1] !== BPM_MAX) && (
                                    <button
                                        type="button"
                                        onClick={() => setBpmRange([BPM_MIN, BPM_MAX])}
                                        className="text-[9px] font-bold text-[#64748b] hover:text-[#ede066] uppercase tracking-wider transition-colors"
                                    >
                                        {t('reset')}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 items-center mb-2">
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider">Min</span>
                                <input
                                    type="number"
                                    min={BPM_MIN}
                                    max={BPM_MAX}
                                    value={bpmRange[0]}
                                    onChange={(e) => {
                                        const v = Math.min(BPM_MAX, Math.max(BPM_MIN, parseInt(e.target.value, 10) || BPM_MIN));
                                        setBpmRange([v, Math.max(v, bpmRange[1])]);
                                    }}
                                    className="w-full bg-[#0b1121] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#ede066]/50"
                                />
                            </label>
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider">Max</span>
                                <input
                                    type="number"
                                    min={BPM_MIN}
                                    max={BPM_MAX}
                                    value={bpmRange[1]}
                                    onChange={(e) => {
                                        const v = Math.min(BPM_MAX, Math.max(BPM_MIN, parseInt(e.target.value, 10) || BPM_MAX));
                                        setBpmRange([Math.min(v, bpmRange[0]), v]);
                                    }}
                                    className="w-full bg-[#0b1121] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#ede066]/50"
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
                                    setBpmRange([v, Math.max(v, bpmRange[1])]);
                                }}
                                className="flex-1 min-w-0 w-0 accent-[#ede066] h-1.5 bg-[#0b1121] rounded-full appearance-none cursor-pointer"
                            />
                            <input
                                type="range"
                                min={BPM_MIN}
                                max={BPM_MAX}
                                value={bpmRange[1]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setBpmRange([Math.min(v, bpmRange[0]), v]);
                                }}
                                className="flex-1 min-w-0 w-0 accent-[#ede066] h-1.5 bg-[#0b1121] rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                        <p className="text-[9px] text-[#64748b] mt-1.5">{BPM_MIN} - {BPM_MAX} {t('bpmRangeHint')}</p>
                    </div>

                    {/* Price Range */}
                    <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5 min-w-0">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                                {t('price')}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-[#ede066] bg-[#ede066]/10 px-2 py-0.5 rounded border border-[#ede066]/20">
                                    {priceRange[0].toLocaleString('tr-TR')} - {priceRange[1].toLocaleString('tr-TR')}
                                </span>
                                {(priceRange[0] !== priceBounds[0] || priceRange[1] !== priceBounds[1]) && (
                                    <button
                                        type="button"
                                        onClick={() => setPriceRange([priceBounds[0], priceBounds[1]])}
                                        className="text-[9px] font-bold text-[#64748b] hover:text-[#ede066] uppercase tracking-wider transition-colors"
                                    >
                                        {t('reset')}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex gap-2 items-center mb-2">
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider">Min</span>
                                <input
                                    type="number"
                                    min={priceBounds[0]}
                                    max={priceBounds[1]}
                                    value={priceRange[0]}
                                    onChange={(e) => {
                                        const v = Math.min(priceBounds[1], Math.max(priceBounds[0], Number(e.target.value) || priceBounds[0]));
                                        setPriceRange([v, Math.max(v, priceRange[1])]);
                                    }}
                                    className="w-full bg-[#0b1121] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#ede066]/50"
                                />
                            </label>
                            <label className="flex-1 flex flex-col gap-1">
                                <span className="text-[9px] font-bold text-[#64748b] uppercase tracking-wider">Max</span>
                                <input
                                    type="number"
                                    min={priceBounds[0]}
                                    max={priceBounds[1]}
                                    value={priceRange[1]}
                                    onChange={(e) => {
                                        const v = Math.min(priceBounds[1], Math.max(priceBounds[0], Number(e.target.value) || priceBounds[1]));
                                        setPriceRange([Math.min(v, priceRange[0]), v]);
                                    }}
                                    className="w-full bg-[#0b1121] border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-[#ede066]/50"
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
                                    setPriceRange([v, Math.max(v, priceRange[1])]);
                                }}
                                className="flex-1 min-w-0 w-0 accent-[#ede066] h-1.5 bg-[#0b1121] rounded-full appearance-none cursor-pointer"
                            />
                            <input
                                type="range"
                                min={priceBounds[0]}
                                max={priceBounds[1]}
                                value={priceRange[1]}
                                onChange={(e) => {
                                    const v = Number(e.target.value);
                                    setPriceRange([Math.min(v, priceRange[0]), v]);
                                }}
                                className="flex-1 min-w-0 w-0 accent-[#ede066] h-1.5 bg-[#0b1121] rounded-full appearance-none cursor-pointer"
                            />
                        </div>
                        <div className="flex justify-between text-[9px] font-bold text-[#64748b] mt-2 px-1">
                            <span>{priceBounds[0].toLocaleString('tr-TR')}</span>
                            <span>{priceBounds[1].toLocaleString('tr-TR')}</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
