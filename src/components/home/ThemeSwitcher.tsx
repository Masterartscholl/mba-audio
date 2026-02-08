"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';

const THEMES = [
    { value: 'light', key: 'lightMode' as const },
    { value: 'dark', key: 'darkMode' as const }
] as const;

export const ThemeSwitcher: React.FC = () => {
    const t = useTranslations('App');
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const current = resolvedTheme ?? theme ?? 'dark';

    if (!mounted) {
        return (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-app-surface border border-app-border text-app-text-muted text-xs font-bold uppercase tracking-widest min-w-[4.5rem] justify-center">
                —
            </div>
        );
    }

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-app-surface border border-app-border text-app-text-muted hover:text-app-text hover:border-app-border transition-all text-xs font-bold uppercase tracking-widest"
                aria-label={t('appearance')}
            >
                {current === 'dark' ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                )}
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 py-1 w-40 rounded-xl bg-app-card border border-app-border shadow-xl z-[200]">
                    {THEMES.map(({ value, key }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => {
                                setTheme(value);
                                setOpen(false);
                            }}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2 ${current === value ? 'text-app-primary bg-app-primary/10' : 'text-app-text-muted hover:text-app-text hover:bg-app-surface'}`}
                        >
                            {value === 'dark' ? (
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
                            ) : (
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                            )}
                            {t(key)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
