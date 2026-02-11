"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { supabase } from '@/lib/supabase';
import { ThemeSwitcher } from '@/components/home/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/home/LanguageSwitcher';
import logoImg from '@/images/logo.png';

export default function SignupPage() {
  const t = useTranslations('App');
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName.trim() || undefined },
          emailRedirectTo: `${window.location.origin}${returnUrl ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`,
        },
      });
      if (err) throw err;
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ full_name: fullName.trim() || null })
          .eq('id', user.id);
        router.push(returnUrl);
      } else {
        router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}&message=confirm_email`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Kayıt sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnUrl)}`,
        },
      });
      if (err) throw err;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google ile giriş yapılamadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] bg-app-bg flex flex-col">
      <header className="border-b border-app-border px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
        <Link href="/" className="flex items-center gap-2 sm:gap-3">
          <Image src={logoImg} alt="MüzikBank" width={32} height={32} className="rounded-xl object-contain sm:w-9 sm:h-9" />
          <span className="text-base sm:text-lg font-black text-app-text uppercase tracking-wider hidden sm:inline">MüzikBank</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-md">
          <div className="text-center mb-5 sm:mb-6 lg:mb-8">
            <h1 className="text-xl sm:text-2xl font-black text-app-text uppercase tracking-widest">{t('signupTitle')}</h1>
            <p className="text-app-text-muted text-xs sm:text-sm mt-1.5 sm:mt-2">{t('signupSubtitle')}</p>
          </div>

          <div className="bg-app-card border border-app-border rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 shadow-xl">
            <form onSubmit={handleSignup} className="space-y-3.5 sm:space-y-4 lg:space-y-5">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-xs sm:text-sm text-center">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-[11px] sm:text-xs uppercase font-bold text-app-text-muted tracking-wider mb-1 sm:mb-1.5">{t('fullName')}</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t('fullNamePlaceholder')}
                  className="w-full bg-app-input-bg border border-app-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs uppercase font-bold text-app-text-muted tracking-wider mb-1 sm:mb-1.5">{t('email')}</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="w-full bg-app-input-bg border border-app-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-[11px] sm:text-xs uppercase font-bold text-app-text-muted tracking-wider mb-1 sm:mb-1.5">{t('password')}</label>
                <input
                  required
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-app-input-bg border border-app-border rounded-xl px-3.5 sm:px-4 py-2.5 sm:py-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all"
                />
                <p className="text-[11px] sm:text-xs text-app-text-muted mt-1">{t('passwordMinHint')}</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-app-primary text-app-primary-foreground font-bold py-3 sm:py-3.5 rounded-xl text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-app-primary-foreground/30 border-t-app-primary-foreground rounded-full animate-spin" />
                ) : (
                  t('signupButton')
                )}
              </button>
            </form>

            <div className="relative my-4 sm:my-6">
              <span className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-app-border" />
              </span>
              <span className="relative flex justify-center text-[11px] sm:text-xs uppercase font-bold text-app-text-muted tracking-wider">
                {t('or')}
              </span>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full bg-app-surface border border-app-border text-app-text font-bold py-3 sm:py-3.5 rounded-xl text-sm hover:border-app-primary/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              {t('signupWithGoogle')}
            </button>
          </div>

          <p className="text-center text-app-text-muted text-xs sm:text-sm mt-4 sm:mt-6">
            {t('alreadyHaveAccount')}{' '}
            <Link href={`/login${returnUrl !== '/' ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ''}`} className="text-app-primary font-bold hover:underline">
              {t('loginLink')}
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
