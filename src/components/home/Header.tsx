"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export const Header: React.FC = () => {
    return (
        <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between sticky top-0 bg-[#0b1121]/80 backdrop-blur-xl z-50">
            {/* Logo & Search */}
            <div className="flex items-center gap-10 flex-1">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                    <span className="text-xl font-black text-white tracking-tighter uppercase">SonicLib</span>
                </div>

                <div className="relative w-full max-w-xl">
                    <input
                        type="text"
                        placeholder="Search tracks, artists, moods..."
                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-12 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-[#64748b] placeholder:font-bold"
                    />
                    <svg className="w-5 h-5 text-[#64748b] absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </div>
            </div>

            {/* Navigation & User */}
            <div className="flex items-center gap-8 pl-10">
                <nav className="hidden lg:flex items-center gap-8">
                    <a href="#" className="text-sm font-black text-white hover:text-[#ede066] transition-colors uppercase tracking-widest">Discover</a>
                    <a href="#" className="text-sm font-black text-[#64748b] hover:text-white transition-colors uppercase tracking-widest">Library</a>
                    <a href="#" className="text-sm font-black text-[#64748b] hover:text-white transition-colors uppercase tracking-widest">Marketplace</a>
                </nav>

                <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                    <button className="px-6 py-2.5 bg-[#3b82f6] rounded-xl text-xs font-black text-white uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-blue-500/20 active:scale-95">
                        Upgrade
                    </button>
                    <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-white/20 transition-all">
                        <img src="https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff" alt="User" className="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </header>
    );
};
