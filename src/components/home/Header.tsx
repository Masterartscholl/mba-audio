"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { useSearch } from '@/context/SearchContext';
import { CartDrawer } from './CartDrawer';
import { LanguageSwitcher } from './LanguageSwitcher';

import logoImg from '@/images/logo.jpg';

export const Header: React.FC = () => {
    const pathname = usePathname();
    const t = useTranslations('App');
    const { openCart, totalCount } = useCart();
    const { query, setQuery } = useSearch();

    const navClass = (path: string) =>
        `text-sm font-black uppercase tracking-widest transition-colors ${pathname === path ? 'text-[#ede066]' : 'text-[#64748b] hover:text-white'}`;

    return (
        <>
            <header className="h-20 border-b border-white/5 px-10 flex items-center justify-between sticky top-0 bg-[#0a0a0a]/90 backdrop-blur-xl z-50">
                <div className="flex items-center gap-10 flex-1">
                    <Link href="/" className="flex items-center shrink-0">
                        <Image src={logoImg} alt="MüzikBank" width={40} height={40} className="rounded-xl object-contain" />
                    </Link>

                    <div className="relative w-full max-w-xl">
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/20 transition-all placeholder:text-[#64748b] placeholder:font-bold"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-8 pl-10">
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link href="/" className={navClass('/')}>{t('discover')}</Link>
                        <Link href="/library" className={navClass('/library')}>{t('myLibrary')}</Link>
                        <Link href="/favorites" className={navClass('/favorites')}>{t('myFavorites')}</Link>
                    </nav>

                    <div className="flex items-center gap-4 border-l border-white/10 pl-8">
                        <LanguageSwitcher />
                        <button
                            onClick={openCart}
                            className="relative w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#94a3b8] hover:text-[#ede066] hover:border-[#ede066]/30 transition-all"
                            aria-label={t('openCart')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {totalCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#ede066] text-[#0b1121] text-[10px] font-black flex items-center justify-center">
                                    {totalCount > 99 ? '99+' : totalCount}
                                </span>
                            )}
                        </button>
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden cursor-pointer hover:border-white/20 transition-all">
                            <img src="https://ui-avatars.com/api/?name=User&background=3b82f6&color=fff" alt="User" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </header>
            <CartDrawer />
        </>
    );
};
