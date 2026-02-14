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
    const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    // Handle mobile back button for user menu drawer
    useEffect(() => {
        if (userMenuOpen) {
            window.history.pushState({ menu: 'user' }, '');
            const handlePopState = () => setUserMenuOpen(false);
            window.addEventListener('popstate', handlePopState);
            return () => {
                window.removeEventListener('popstate', handlePopState);
                if (window.history.state?.menu === 'user') {
                    window.history.back();
                }
            };
        }
    }, [userMenuOpen]);

    // Handle mobile back button for search overlay
    useEffect(() => {
        if (isMobileSearchOpen) {
            window.history.pushState({ action: 'search' }, '');
            const handlePopState = () => setIsMobileSearchOpen(false);
            window.addEventListener('popstate', handlePopState);
            return () => {
                window.removeEventListener('popstate', handlePopState);
                if (window.history.state?.action === 'search') {
                    window.history.back();
                }
            };
        }
    }, [isMobileSearchOpen]);

    const navClass = (path: string) =>
        `text-sm font-black uppercase tracking-widest transition-colors ${pathname === path ? 'text-app-primary' : 'text-app-text-muted hover:text-app-text'}`;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUserMenuOpen(false);
    };

    return (
        <>
            <header className="h-16 lg:h-20 border-b border-app-border px-4 lg:px-10 flex items-center justify-between sticky top-0 bg-app-bg/90 backdrop-blur-xl z-50 transition-all">
                {/* Mobile Search Overlay */}
                {isMobileSearchOpen && (
                    <div className="absolute inset-0 bg-app-bg flex items-center px-4 animate-in fade-in slide-in-from-top-2 duration-200 z-[60]">
                        <button
                            onClick={() => setIsMobileSearchOpen(false)}
                            className="w-10 h-10 flex items-center justify-center text-app-text-muted hover:text-app-text"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <input
                            autoFocus
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={t('searchPlaceholder')}
                            className="flex-1 bg-transparent border-none px-2 py-2 text-sm text-app-text focus:outline-none placeholder:text-app-text-muted font-bold"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="w-8 h-8 flex items-center justify-center text-app-text-muted"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        )}
                    </div>
                )}

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
                        {/* Mobile Search Button */}
                        <button
                            onClick={() => setIsMobileSearchOpen(true)}
                            className="sm:hidden w-9 h-9 rounded-xl bg-app-surface border border-app-border flex items-center justify-center text-app-text-muted"
                        >
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
                                    <>
                                        {/* Mobile Backdrop */}
                                        <div
                                            className="lg:hidden fixed inset-0 bg-black/50 z-[190]"
                                            onClick={() => setUserMenuOpen(false)}
                                        />

                                        {/* Dropdown / Drawer */}
                                        <div className="
                                            fixed inset-x-0 top-0 p-6 bg-app-bg border-b border-app-border shadow-2xl z-[200] animate-in slide-in-from-top duration-300
                                            lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-2 lg:p-0 lg:min-w-[240px] lg:rounded-2xl lg:bg-app-card lg:border lg:shadow-xl lg:animate-in lg:fade-in lg:zoom-in-95
                                        ">
                                            {/* Mobile Header with Close Button */}
                                            <div className="lg:hidden flex items-center justify-between mb-6">
                                                <span className="text-sm font-black text-app-text-muted uppercase tracking-widest">{t('account')}</span>
                                                <button
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-app-surface text-app-text-muted hover:text-app-text"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-3 px-0 lg:px-4 py-0 lg:py-3 border-b-0 lg:border-b border-app-border mb-4 lg:mb-0">
                                                <div className="w-10 h-10 rounded-full bg-app-primary/10 text-app-primary flex items-center justify-center font-black text-lg shrink-0">
                                                    {avatarUrl ? (
                                                        <img src={avatarUrl} alt="" className="w-full h-full object-cover rounded-full" />
                                                    ) : (
                                                        (displayName || 'U')[0].toUpperCase()
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-app-text truncate">{displayName || user.email}</p>
                                                    <p className="text-xs text-app-text-muted truncate">{user.email}</p>
                                                </div>
                                            </div>

                                            <div className="lg:hidden space-y-1 mb-4">
                                                <Link
                                                    href="/"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-app-surface text-sm font-bold text-app-text-muted hover:text-app-text transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                                    {t('discover')}
                                                </Link>
                                                <Link
                                                    href="/library"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-app-surface text-sm font-bold text-app-text-muted hover:text-app-text transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7v8m0 0l3-3m-3 3L5 8m0 0h8M5 8V7" /></svg>
                                                    {t('myLibrary')}
                                                </Link>
                                                <Link
                                                    href="/favorites"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-app-surface text-sm font-bold text-app-text-muted hover:text-app-text transition-colors"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                                                    {t('myFavorites')}
                                                </Link>
                                            </div>

                                            <div className="pt-2 lg:pt-1 pb-1">
                                                <Link
                                                    href="/settings"
                                                    onClick={() => setUserMenuOpen(false)}
                                                    className="flex items-center gap-3 w-full px-3 lg:px-4 py-3 lg:py-2.5 text-sm font-bold text-app-text-muted hover:text-app-text hover:bg-app-surface transition-colors rounded-xl lg:rounded-none"
                                                >
                                                    <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                                    {t('accountSettings')}
                                                </Link>
                                                <button
                                                    type="button"
                                                    onClick={handleLogout}
                                                    className="flex items-center gap-3 w-full text-left px-3 lg:px-4 py-3 lg:py-2.5 text-sm font-bold text-red-500 hover:text-red-600 hover:bg-red-500/10 transition-colors rounded-xl lg:rounded-none"
                                                >
                                                    <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                                    {t('logout')}
                                                </button>
                                            </div>
                                        </div>
                                    </>
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
