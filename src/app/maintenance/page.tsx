"use client";

import React from 'react';
import { useTranslations } from 'next-intl';

export default function MaintenancePage() {
    const t = useTranslations('Settings');

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-admin-primary/10 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] animate-pulse delay-700"></div>

            <div className="max-w-md w-full bg-[#1a1a1a]/40 backdrop-blur-2xl border border-white/10 rounded-[32px] p-12 text-center relative z-10 shadow-2xl">
                <div className="w-24 h-24 bg-admin-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-admin-primary/20">
                    <svg className="w-12 h-12 text-admin-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>

                <h1 className="text-3xl font-black text-white mb-4 tracking-tight uppercase">
                    {t('maintenanceMode')}
                </h1>

                <p className="text-white/60 font-medium leading-relaxed mb-8">
                    {t('maintenanceDesc')}
                </p>

                <div className="pt-8 border-t border-white/5">
                    <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.4em]">
                        MüzikBank MBA &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </div>
        </div>
    );
}
