"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useTranslations } from 'next-intl';

interface FilterProps {
    onFilterChange: (filters: any) => void;
}

export const Sidebar: React.FC<FilterProps> = ({ onFilterChange }) => {
    const t = useTranslations('Home');
    const [categories, setCategories] = useState<any[]>([]);
    const [genres, setGenres] = useState<any[]>([]);
    const [modes, setModes] = useState<any[]>([]);

    const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
    const [selectedGenres, setSelectedGenres] = useState<number[]>([]);
    const [selectedMode, setSelectedMode] = useState<number | null>(null);
    const [bpmRange, setBpmRange] = useState<[number, number]>([80, 140]);
    const [priceRange, setPriceRange] = useState<number>(500);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        const { data: catData } = await supabase.from('categories').select('*');
        const { data: modeData } = await supabase.from('modes').select('*');
        setCategories(catData || []);
        setModes(modeData || []);
    };

    useEffect(() => {
        if (selectedCategory) {
            fetchGenres(selectedCategory);
        } else {
            setGenres([]);
        }
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
            maxPrice: priceRange
        });
    };

    useEffect(() => {
        handleFilterUpdate();
    }, [selectedCategory, selectedGenres, selectedMode, bpmRange, priceRange]);

    return (
        <aside className="w-80 bg-[#0b1121] border-r border-white/5 flex flex-col h-screen sticky top-0 overflow-y-hidden">
            {/* Logo Area */}
            <div className="h-24 flex items-center px-8 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#ede066] flex items-center justify-center shadow-[0_0_15px_rgba(237,224,102,0.3)]">
                        <svg className="w-5 h-5 text-[#0b1121]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white tracking-tight leading-none">MüzikBank</h1>
                        <p className="text-[10px] font-bold text-[#64748b] tracking-widest uppercase">Audio Library</p>
                    </div>
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 pb-32">
                {/* Navigation */}
                <div>
                    <h3 className="text-xs font-black text-[#64748b] tracking-[0.2em] mb-4 pl-2 uppercase">Menu</h3>
                    <nav className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-4 py-3 bg-white/5 text-[#ede066] rounded-xl font-bold text-sm transition-all border border-white/5 shadow-inner">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                            <span>Home</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-[#94a3b8] hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-all group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
                            <span>Trending</span>
                        </button>
                        <button className="w-full flex items-center gap-3 px-4 py-3 text-[#94a3b8] hover:text-white hover:bg-white/5 rounded-xl font-bold text-sm transition-all group">
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span>New Releases</span>
                        </button>
                    </nav>
                </div>

                {/* Filters Group */}
                <div className="space-y-6">
                    <h3 className="text-xs font-black text-[#64748b] tracking-[0.2em] mb-4 pl-2 uppercase">Filters</h3>

                    {/* Category Selection */}
                    <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5">
                        <p className="text-[11px] font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                            Category
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

                    {/* Mood Selection */}
                    <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5">
                        <p className="text-[11px] font-black text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                            <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                            Mood
                        </p>
                        <div className="relative">
                            <select
                                value={selectedMode || ''}
                                onChange={(e) => setSelectedMode(e.target.value ? Number(e.target.value) : null)}
                                className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white font-bold appearance-none focus:outline-none focus:border-[#ede066]/50 transition-all cursor-pointer hover:bg-[#0f172a]">
                                <option value="">Select Mood</option>
                                {modes.map(mode => (
                                    <option key={mode.id} value={mode.id}>{mode.name}</option>
                                ))}
                            </select>
                            <svg className="w-3.5 h-3.5 text-[#64748b] absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                        </div>
                    </div>

                    {/* BPM Range Slider */}
                    <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                                BPM
                            </p>
                            <span className="text-[10px] font-black text-[#ede066] bg-[#ede066]/10 px-2 py-0.5 rounded border border-[#ede066]/20">{bpmRange[0]} - {bpmRange[1]}</span>
                        </div>
                        <input
                            type="range" min="40" max="250" value={bpmRange[1]}
                            onChange={(e) => setBpmRange([bpmRange[0], Number(e.target.value)])}
                            className="w-full accent-[#ede066] h-1 bg-[#0b1121] rounded-full appearance-none cursor-pointer hover:accent-white transition-all"
                        />
                    </div>

                    {/* Price Slider */}
                    <div className="bg-[#131b2e] rounded-2xl p-4 border border-white/5">
                        <div className="flex justify-between items-center mb-3">
                            <p className="text-[11px] font-black text-white uppercase tracking-wider flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]"></span>
                                Price
                            </p>
                            <span className="text-[10px] font-black text-[#ede066] bg-[#ede066]/10 px-2 py-0.5 rounded border border-[#ede066]/20">${priceRange}</span>
                        </div>
                        <input
                            type="range" min="0" max="1000" value={priceRange}
                            onChange={(e) => setPriceRange(Number(e.target.value))}
                            className="w-full accent-[#ede066] h-1 bg-[#0b1121] rounded-full appearance-none cursor-pointer hover:accent-white transition-all"
                        />
                        <div className="flex justify-between text-[9px] font-bold text-[#64748b] mt-2 px-1">
                            <span>$0</span>
                            <span>$1000</span>
                        </div>
                    </div>
                </div>
            </div>
        </aside>
    );
};
