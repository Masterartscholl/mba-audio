"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { useSearch } from '@/context/SearchContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { CartDrawer } from './CartDrawer';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeSwitcher } from './ThemeSwitcher';

import logoImg from '@/images/logo.jpg';

export const Header: React.FC = () => {
    const pathname = usePathname();
    const t = useTranslations('App');
    const { openCart, totalCount } = useCart();
    const { query, setQuery } = useSearch();
    const { user, loading, displayName, avatarUrl } = useAuth();
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const navClass = (path: string) =>
        `text-sm font-black uppercase tracking-widest transition-colors ${pathname === path ? 'text-app-primary' : 'text-app-text-muted hover:text-app-text'}`;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUserMenuOpen(false);
    };

    return (
        <>
            <header className="h-20 border-b border-app-border px-10 flex items-center justify-between sticky top-0 bg-app-bg/90 backdrop-blur-xl z-50">
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
                            className="w-full bg-app-surface border border-app-border rounded-2xl px-4 py-3 text-sm text-app-text focus:outline-none focus:border-app-primary/50 transition-all placeholder:text-app-text-muted placeholder:font-bold"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-8 pl-10">
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link href="/" className={navClass('/')}>{t('discover')}</Link>
                        <Link href="/library" className={navClass('/library')}>{t('myLibrary')}</Link>
                        <Link href="/favorites" className={navClass('/favorites')}>{t('myFavorites')}</Link>
                    </nav>

                    <div className="flex items-center gap-4 border-l border-app-border pl-8">
                        <ThemeSwitcher />
                        <LanguageSwitcher />
                        <button
                            onClick={openCart}
                            className="relative w-10 h-10 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted hover:text-app-primary hover:border-app-primary/30 transition-all"
                            aria-label={t('openCart')}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            {totalCount > 0 && (
                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-app-primary text-app-primary-foreground text-[10px] font-black flex items-center justify-center">
                                    {totalCount > 99 ? '99+' : totalCount}
                                </span>
                            )}
                        </button>

                        {/* Kullanıcı alanı: yüklenirken Giriş/Kayıt göster, sonra kullanıcı veya butonlar */}
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <span className="w-10 h-10 rounded-xl bg-app-surface border border-app-border animate-pulse" aria-hidden />
                            </div>
                        ) : user ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((o) => !o)}
                                    className="flex items-center gap-2 w-10 h-10 rounded-xl bg-app-surface border border-app-border overflow-hidden hover:border-app-primary/30 transition-all shrink-0"
                                    aria-label={t('accountSettings')}
                                >
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <span className="w-full h-full flex items-center justify-center text-app-primary font-black text-sm bg-app-surface">
                                            {(displayName || 'U')[0].toUpperCase()}
                                        </span>
                                    )}
                                </button>
                                {userMenuOpen && (
                                    <div className="absolute right-0 top-full mt-1 py-1 min-w-[180px] rounded-xl bg-app-card border border-app-border shadow-xl z-[200]">
                                        <div className="px-4 py-2 border-b border-app-border">
                                            <p className="text-sm font-bold text-app-text truncate">{displayName || user.email}</p>
                                            <p className="text-xs text-app-text-muted truncate">{user.email}</p>
                                        </div>
                                        <Link
                                            href="/settings"
                                            onClick={() => setUserMenuOpen(false)}
                                            className="block px-4 py-2.5 text-sm font-bold text-app-text-muted hover:text-app-text hover:bg-app-surface transition-colors"
                                        >
                                            {t('accountSettings')}
                                        </Link>
                                        <button
                                            type="button"
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2.5 text-sm font-bold text-app-text-muted hover:text-app-text hover:bg-app-surface transition-colors"
                                        >
                                            {t('logout')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Link
                                    href="/login"
                                    className="px-3 py-2 rounded-xl bg-app-surface border border-app-border text-app-text-muted hover:text-app-text text-xs font-bold uppercase tracking-widest transition-colors"
                                >
                                    {t('login')}
                                </Link>
                                <Link
                                    href="/signup"
                                    className="px-3 py-2 rounded-xl bg-app-primary text-app-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity"
                                >
                                    {t('signup')}
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </header>
            <CartDrawer />
        </>
    );
};
