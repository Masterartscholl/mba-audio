"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { setUserLocale } from '@/services/locale';
import { useRouter } from 'next/navigation';

const LOCALES = [
    { code: 'tr', key: 'turkish' as const },
    { code: 'en', key: 'english' as const }
] as const;

export const LanguageSwitcher: React.FC = () => {
    const t = useTranslations('App');
    const router = useRouter();
    const currentLocale = useLocale();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    const handleSelect = async (code: string) => {
        setOpen(false);
        // Persist local preference
        if (typeof window !== 'undefined') {
            localStorage.setItem('NEXT_LOCALE', code);

            // For iframes (Wix), URL-based switching is the most reliable.
            // We append ?locale=... to the URL and reload.
            const url = new URL(window.location.href);
            url.searchParams.set('locale', code);

            // Call the server action to try and set the cookie too
            await setUserLocale(code);

            // Full reload to ensure middleware picks up the query param
            window.location.href = url.toString();
        } else {
            await setUserLocale(code);
            router.refresh();
        }
    };

    return (
        <div className="relative" ref={ref}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-app-surface border border-app-border text-app-text-muted hover:text-app-text hover:border-app-border transition-all text-xs font-bold uppercase tracking-widest"
                aria-label={t('language')}
            >
                <span>{currentLocale.toUpperCase()}</span>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute right-0 top-full mt-1 py-1 w-36 rounded-xl bg-app-card border border-app-border shadow-xl z-[200]">
                    {LOCALES.map(({ code, key }) => (
                        <button
                            key={code}
                            type="button"
                            onClick={() => handleSelect(code)}
                            className={`w-full text-left px-4 py-2.5 text-xs font-bold uppercase tracking-widest transition-colors ${currentLocale === code ? 'text-app-primary bg-app-primary/10' : 'text-app-text-muted hover:text-app-text hover:bg-app-surface'}`}
                        >
                            {t(key)}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};
