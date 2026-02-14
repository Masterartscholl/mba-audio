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
import logoImg from '@/images/logo.png';

interface HeaderProps {
    onOpenMobileSidebar?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileSidebar }) => {
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
            <header className="h-16 lg:h-20 border-b border-app-border px-4 lg:px-10 flex items-center justify-between sticky top-0 bg-app-bg/90 backdrop-blur-xl z-50 transition-all">
                <div className="flex items-center gap-3 lg:gap-6 flex-1 min-w-0">
                    {/* Mobile sidebar toggle */}
                    <button
                        type="button"
                        onClick={onOpenMobileSidebar}
                        className="lg:hidden w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text hover:text-app-primary hover:border-app-primary/30 transition-all shrink-0"
                        aria-label={t('filters')}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h10M4 18h7" />
                        </svg>
                    </button>

                    {/* Mobile Logo */}
                    <Link href="/" className="lg:hidden block shrink-0">
                        <Image src={logoImg} alt="MüzikBank" width={32} height={32} className="rounded-lg object-contain" />
                    </Link>

                    <div className="relative w-full max-w-3xl hidden sm:block">
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="w-full bg-app-surface border border-app-border rounded-2xl px-4 py-2.5 lg:py-3 text-sm text-app-text focus:outline-none focus:border-app-primary/50 transition-all placeholder:text-app-text-muted placeholder:font-bold"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 lg:gap-8 pl-2 lg:pl-10 shrink-0">
                    <nav className="hidden lg:flex items-center gap-8">
                        <Link href="/" className={navClass('/')}>{t('discover')}</Link>
                        <Link href="/library" className={navClass('/library')}>{t('myLibrary')}</Link>
                        <Link href="/favorites" className={navClass('/favorites')}>{t('myFavorites')}</Link>
                    </nav>

                    <div className="flex items-center gap-2 lg:gap-4 border-l-0 lg:border-l border-app-border pl-0 lg:pl-8">
                        {/* Mobile Search Button (Visible only on very small screens if input is hidden) */}
                        <button className="sm:hidden w-9 h-9 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                        </button>

                        <div className="hidden sm:flex items-center gap-2">
                            <ThemeSwitcher />
                            <LanguageSwitcher />
                        </div>

                        <button
                            onClick={openCart}
                            className="relative w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted hover:text-app-primary hover:border-app-primary/30 transition-all"
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
                                <span className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-app-surface border border-app-border animate-pulse" aria-hidden />
                            </div>
                        ) : user ? (
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    type="button"
                                    onClick={() => setUserMenuOpen((o) => !o)}
                                    className="flex items-center gap-2 w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-app-surface border border-app-border overflow-hidden hover:border-app-primary/30 transition-all shrink-0"
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
                                            <p className="text-sm font-bold text-app-text truncate max-w-[150px]">{displayName || user.email}</p>
                                            <p className="text-xs text-app-text-muted truncate max-w-[150px]">{user.email}</p>
                                        </div>
                                        <div className="lg:hidden px-4 py-2 border-b border-app-border">
                                            <Link href="/" className="block py-1 text-sm font-bold text-app-text-muted">{t('discover')}</Link>
                                            <Link href="/library" className="block py-1 text-sm font-bold text-app-text-muted">{t('myLibrary')}</Link>
                                            <Link href="/favorites" className="block py-1 text-sm font-bold text-app-text-muted">{t('myFavorites')}</Link>
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
                                    className="px-3 py-2 rounded-xl bg-app-surface border border-app-border text-app-text-muted hover:text-app-text text-xs font-bold uppercase tracking-widest transition-colors hidden sm:block"
                                >
                                    {t('login')}
                                </Link>
                                <Link
                                    href="/login"
                                    className="w-9 h-9 flex items-center justify-center rounded-xl bg-app-surface border border-app-border text-app-text-muted hover:text-app-text sm:hidden"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" /></svg>
                                </Link>

                                <Link
                                    href="/signup"
                                    className="px-3 py-2 rounded-xl bg-app-primary text-app-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity hidden sm:block"
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
