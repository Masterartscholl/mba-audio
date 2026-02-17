"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const Sidebar = () => {
    const pathname = usePathname();
    const router = useRouter();
    const t = useTranslations('Sidebar');
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    const handleLogout = async () => {
        await supabaseAdmin.auth.signOut();
        router.push('/admin/login');
    };

    // useEffect only runs on the client, so now we can safely show the UI
    React.useEffect(() => {
        setMounted(true);
    }, []);

    const menuItems = [
        {
            name: t('dashboard'),
            path: '/admin',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
            )
        },
        {
            name: t('library'),
            path: '/admin/library',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
            )
        },
        {
            name: t('categories'),
            path: '/admin/categories',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
            )
        },
        {
            name: t('analytics'),
            path: '/admin/analytics',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            name: t('settings'),
            path: '/admin/settings',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        }
    ];

    return (
        <aside className="w-64 bg-admin-sidebar border-r border-admin-border flex-col hidden md:flex sticky top-0 h-screen shrink-0 transition-colors duration-300">
            <div className="p-8">
                <div className="flex items-center gap-3 text-admin-primary">
                    <div className="w-8 h-8 rounded-full bg-admin-primary flex items-center justify-center shadow-[0_0_15px_rgba(237,224,102,0.4)] transition-all">
                        <svg className="w-5 h-5 text-admin-bg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                        </svg>
                    </div>
                    <span className="font-bold text-lg tracking-wide text-admin-text">MBA AUDIO</span>
                </div>
            </div>

            <nav className="flex-1 px-4 space-y-2 mt-4">
                {menuItems.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${isActive
                                ? 'bg-admin-primary/10 text-admin-primary border border-admin-primary/20'
                                : 'text-admin-text-muted hover:text-admin-text hover:bg-admin-border/50'
                                }`}
                        >
                            {item.icon}
                            <span className="font-medium">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-admin-border space-y-4">
                {mounted && (
                    <button
                        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                        className="w-full flex items-center justify-between p-3 bg-admin-card rounded-xl border border-admin-border hover:border-admin-primary/50 transition-all group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-admin-bg border border-admin-border flex items-center justify-center text-admin-text-muted group-hover:text-admin-primary transition-colors">
                                {theme === 'dark' ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                                )}
                            </div>
                            <span className="text-sm font-medium text-admin-text">
                                {theme === 'dark' ? t('darkMode') : t('lightMode')}
                            </span>
                        </div>
                        <div className={`w-10 h-5 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-admin-primary' : 'bg-admin-border'}`}>
                            <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${theme === 'dark' ? 'left-6' : 'left-1'}`}></div>
                        </div>
                    </button>
                )}

                <div className="flex items-center justify-between p-3 bg-admin-card rounded-xl border border-admin-border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-admin-bg flex items-center justify-center text-admin-primary font-bold border border-admin-border">A</div>
                        <div>
                            <h4 className="text-sm font-semibold text-admin-text">{t('admin')}</h4>
                            <p className="text-xs text-admin-text-muted">{t('superAdmin')}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-2 text-admin-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title={t('logout')}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </button>
                </div>
            </div>
        </aside>
    );
};
