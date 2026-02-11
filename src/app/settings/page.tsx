"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { ThemeSwitcher } from '@/components/home/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/home/LanguageSwitcher';
import logoImg from '@/images/logo.png';
import { toast } from 'sonner';

export default function SettingsPage() {
  const t = useTranslations('App');
  const searchParams = useSearchParams();
  const { user, profile, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const isCompleteProfile = searchParams.get('complete') === '1';
  const isPasswordReset = searchParams.get('reset') === '1';
  const isProfileIncomplete = !profile?.full_name?.trim();
  const isGoogleUser = Boolean(
    user?.app_metadata?.provider === 'google' ||
    user?.identities?.some((id) => id.provider === 'google')
  );

  useEffect(() => {
    if (!user || !profile) return;
    const fromProfile = profile.full_name?.trim() || '';
    const fromMetadata = (user.user_metadata?.full_name || user.user_metadata?.name || '').trim();
    setFullName(fromProfile || fromMetadata || '');
  }, [user, profile]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() || null })
        .eq('id', user.id);
      if (error) throw error;
      toast.success(t('profileUpdated'));
    } catch (err) {
      toast.error(t('settingsError'));
    } finally {
      setSavingProfile(false);
    }
  };

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
      setNewPassword('');
      setConfirmPassword('');
      toast.success(t('passwordChanged'));
    } catch (err) {
      toast.error(t('settingsError'));
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
      <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-app-text-muted">{t('loginSubtitle')}</p>
        <Link href="/login" className="text-app-primary font-bold hover:underline">
          {t('login')}
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app-bg flex flex-col">
      <header className="border-b border-app-border px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <Image src={logoImg} alt="MüzikBank" width={36} height={36} className="rounded-xl object-contain" />
          <span className="text-lg font-black text-app-text uppercase tracking-wider hidden sm:inline">MüzikBank</span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 py-8 lg:py-10">
        <h1 className="text-2xl font-black text-app-text uppercase tracking-widest mb-1">{t('settingsTitle')}</h1>
        <p className="text-app-text-muted text-sm mb-8 lg:mb-10">{t('settingsSubtitle')}</p>

        {isCompleteProfile && isProfileIncomplete && !isGoogleUser && (
          <div className="bg-app-primary/10 border border-app-primary/30 text-app-text rounded-2xl p-4 mb-6">
            <p className="text-sm font-medium">{t('completeProfileTitle')}</p>
            <p className="text-xs text-app-text-muted mt-1">{t('completeProfileHint')}</p>
          </div>
        )}

        {isPasswordReset && (
          <div className="bg-app-primary/10 border border-app-primary/30 text-app-text rounded-2xl p-4 mb-6">
            <p className="text-sm font-medium">{t('resetPasswordTitle')}</p>
            <p className="text-xs text-app-text-muted mt-1">{t('resetPasswordHint')}</p>
          </div>
        )}

        <section className="bg-app-card border border-app-border rounded-2xl p-6 mb-6">
          <h2 className="text-sm font-black text-app-text uppercase tracking-widest mb-4">{t('profileSection')}</h2>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs uppercase font-bold text-app-text-muted tracking-wider mb-1.5">{t('fullName')}</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fullNamePlaceholder')}
                className="w-full bg-app-input-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs uppercase font-bold text-app-text-muted tracking-wider mb-1.5">{t('email')}</label>
              <input
                type="email"
                value={user.email ?? ''}
                disabled
                className="w-full bg-app-surface border border-app-border rounded-xl px-4 py-3 text-sm text-app-text-muted cursor-not-allowed"
              />
              <p className="text-xs text-app-text-muted mt-1">{t('emailChangeHint')}</p>
            </div>
            <button
              type="submit"
              disabled={savingProfile}
              className="px-6 py-2.5 rounded-xl bg-app-primary text-app-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {savingProfile ? '...' : t('saveProfile')}
            </button>
          </form>
        </section>

        {!isGoogleUser && (
          <section className="bg-app-card border border-app-border rounded-2xl p-6">
            <h2 className="text-sm font-black text-app-text uppercase tracking-widest mb-4">
              {t('changePassword')}
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs uppercase font-bold text-app-text-muted tracking-wider mb-1.5">{t('newPassword')}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-app-input-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs uppercase font-bold text-app-text-muted tracking-wider mb-1.5">{t('confirmPassword')}</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  minLength={6}
                  className="w-full bg-app-input-bg border border-app-border rounded-xl px-4 py-3 text-sm text-app-text placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={changingPassword || !newPassword || !confirmPassword}
                className="px-6 py-2.5 rounded-xl bg-app-primary text-app-primary-foreground font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {changingPassword ? '...' : t('changePassword')}
              </button>
            </form>
          </section>
        )}

        <p className="text-center text-app-text-muted text-sm mt-8">
          <Link href="/" className="text-app-primary font-bold hover:underline">
            ← {t('backToHome')}
          </Link>
        </p>
      </main>
    </div>
  );
}
