"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ThemeSwitcher } from '@/components/home/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/home/LanguageSwitcher';
import logoImg from '@/images/logo.png';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
    const t = useTranslations('App');
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        // If auth loading is done and there's no user, they shouldn't be here
        // But we wait a bit because session might be being restored
        if (!authLoading && !user) {
            // Check if there is an error in the hash (OTP expired etc)
            const hash = window.location.hash;
            if (hash.includes('error=')) {
                const params = new URLSearchParams(hash.replace('#', '?'));
                const errorDesc = params.get('error_description');
                if (errorDesc) {
                    toast.error(errorDesc);
                }
            }
        }
    }, [user, authLoading]);

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error(t('passwordMatchError'));
            return;
        }
        if (newPassword.length < 6) {
            toast.error(t('passwordMinHint'));
            return;
        }
        setChangingPassword(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) throw error;
            toast.success(t('passwordChanged'));
            // Redirect to the Wix-hosted MüzikBank page after successful reset
            window.location.href = 'https://www.muzikburada.net/muzikbank';
        } catch (err: any) {
            toast.error(err.message || t('settingsError'));
        } finally {
            setChangingPassword(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-app-bg flex items-center justify-center">
                <span className="w-8 h-8 border-2 border-app-primary/30 border-t-app-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center gap-6 p-4">
                <Image src={logoImg} alt="MüzikBank" width={64} height={64} className="rounded-2xl object-contain mb-2" />
                <div className="text-center">
                    <h1 className="text-xl font-black text-app-text tracking-widest uppercase mb-2">{t('forgotPasswordError')}</h1>
                    <p className="text-sm text-app-text-muted max-w-xs">{t('resetPasswordHint')}</p>
                </div>
                <Link href="/login" className="px-8 py-3 bg-app-primary text-app-primary-foreground font-black text-sm uppercase tracking-wider rounded-xl hover:opacity-90 transition-all shadow-lg shadow-app-primary/20">
                    {t('login')}
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
            <header className="fixed top-0 left-0 right-0 border-b border-app-border px-6 py-4 flex items-center justify-between bg-app-bg/80 backdrop-blur-md z-50">
                <Link href="/" className="flex items-center gap-3">
                    <Image src={logoImg} alt="MüzikBank" width={32} height={32} className="rounded-lg object-contain" priority />
                    <span className="text-base font-black text-app-text uppercase tracking-wider hidden sm:inline">MüzikBank</span>
                </Link>
                <div className="flex items-center gap-3">
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                </div>
            </header>

            <div className="w-full max-w-md bg-app-card border border-app-border rounded-3xl p-8 shadow-2xl mt-16">
                <div className="flex flex-col items-center mb-8">
                    <h1 className="text-xl font-black text-app-text uppercase tracking-widest text-center">{t('resetPasswordTitle')}</h1>
                    <p className="text-xs text-app-text-muted text-center mt-3 leading-relaxed">
                        {t('resetPasswordHint')}
                    </p>
                    {user.email && (
                        <span className="mt-4 px-3 py-1 bg-app-surface rounded-full text-[10px] font-bold text-app-text-muted border border-app-border">
                            {user.email}
                        </span>
                    )}
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-[11px] uppercase font-bold text-app-text-muted tracking-wider mb-1.5 ml-1">{t('newPassword')}</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                            className="w-full bg-app-input-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all font-medium"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-[11px] uppercase font-bold text-app-text-muted tracking-wider mb-1.5 ml-1">{t('confirmPassword')}</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            minLength={6}
                            className="w-full bg-app-input-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all font-medium"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={changingPassword || !newPassword || !confirmPassword}
                        className="w-full mt-4 py-4 rounded-xl bg-app-primary text-app-primary-foreground font-black text-sm uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-app-primary/20"
                    >
                        {changingPassword ? t('loading') : t('passwordUpdate')}
                    </button>

                    <p className="text-center mt-6">
                        <Link href="/" className="text-app-text-muted text-xs font-bold hover:text-app-primary transition-colors">
                            ← {t('backToHome')}
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
