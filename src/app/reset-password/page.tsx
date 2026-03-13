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
    const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const resetToken = searchParams?.get('token') || null;
    const { user, loading: authLoading, authToken } = useAuth();
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        // If auth loading is done and there's no user AND no reset token, they shouldn't be here
        // But we wait a bit because session might be being restored
        if (!authLoading && !user && !resetToken) {
            const hash = window.location.hash;
            if (hash.includes('error=')) {
                const params = new URLSearchParams(hash.replace('#', '?'));
                const errorDesc = params.get('error_description');
                if (errorDesc) {
                    toast.error(errorDesc);
                }
            }
        }
    }, [user, authLoading, resetToken]);

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
        console.log('ResetPasswordPage: Attempting to change password via API...');

        try {
            const isWix = typeof window !== 'undefined' && window.location.origin.includes('muzikburada.net');
            const baseUrl = isWix ? 'https://mba-audio.vercel.app' : '';

            if (resetToken) {
                // E-posta ile gelen token üzerinden (oturum gerektirmeyen) şifre sıfırlama
                const response = await fetch(`${baseUrl}/api/auth/password-reset/confirm`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ token: resetToken, password: newPassword })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || t('settingsError'));
                }
            } else {
                // Oturum açıkken (settings sayfasından) şifre güncelleme
                const token = authToken || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('muzikbank-auth-token') || '{}')?.access_token : null);

                if (!token) {
                    console.error('ResetPasswordPage: No auth token found!');
                    toast.error(t('settingsError') + ' (Oturum bulunamadı)');
                    setChangingPassword(false);
                    return;
                }

                const response = await fetch(`${baseUrl || ''}/api/me/update-password`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ password: newPassword })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || t('settingsError'));
                }
            }

            console.log('ResetPasswordPage: Password updated successfully');
            toast.success(t('passwordChanged'));

            // Redirect to the Wix-hosted MüzikBank page after successful reset
            window.location.href = 'https://www.muzikburada.net/muzikbank';
        } catch (err: any) {
            console.error('ResetPasswordPage: Password update API error:', err);
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

    if (!user && !resetToken) {
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
                    {user?.email && (
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
