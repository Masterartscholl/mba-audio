"use client";

import React, { useState, useEffect } from 'react';
import { supabaseAdmin as supabase } from '@/lib/supabase-admin';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { useTranslations } from 'next-intl';
import { setUserLocale } from '@/services/locale';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';

type Settings = {
    site_title: string;
    contact_email: string;
    whatsapp_no: string;
    default_price: number | '';
    currency: string;
    is_watermark_active: boolean;
    is_maintenance_mode: boolean;
    active_theme: string;
    default_lang: string;
    link_privacy_policy: string;
    link_distance_selling: string;
    link_delivery_return: string;
    link_terms_conditions: string;
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'music' | 'account'>('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const t = useTranslations('Settings');
    const { setTheme } = useTheme();
    const [user, setUser] = useState<any>(null);

    // Settings State
    const [settings, setSettings] = useState<Settings>({
        site_title: '',
        contact_email: '',
        whatsapp_no: '',
        default_price: 0,
        currency: 'TL',
        is_watermark_active: true,
        is_maintenance_mode: false,
        active_theme: 'dark',
        default_lang: 'tr',
        link_privacy_policy: '',
        link_distance_selling: '',
        link_delivery_return: '',
        link_terms_conditions: ''
    });

    // Profile State
    const [profile, setProfile] = useState({
        full_name: '',
        avatar_url: ''
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        const init = async () => {
            try {
                const [
                    { data: { user } },
                    settingsRes
                ] = await Promise.all([
                    supabase.auth.getUser(),
                    fetchSettings()
                ]);

                if (user) {
                    setUser(user);
                    fetchProfile(user.id);
                }
            } catch (err) {
                console.error('Init error:', err);
            }
        };
        init();
    }, []);

    const fetchProfile = async (userId: string) => {
        const { data, error } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', userId)
            .maybeSingle();

        if (data) {
            setProfile({
                full_name: data.full_name || '',
                avatar_url: data.avatar_url || ''
            });
        }
    };

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('settings')
                .select('*')
                .eq('id', 1)
                .maybeSingle(); // .single() yerine .maybeSingle() kullanarak boş tablo hatasını önlüyoruz

            if (error) {
                console.error('Supabase fetch error:', error);
                toast.error('Ayarlar yüklenirken bir hata oluştu');
            } else if (data) {
                setSettings({
                    ...data,
                    default_lang: data.default_lang || 'tr',
                    link_privacy_policy: data.link_privacy_policy ?? '',
                    link_distance_selling: data.link_distance_selling ?? '',
                    link_delivery_return: data.link_delivery_return ?? '',
                    link_terms_conditions: data.link_terms_conditions ?? ''
                });
            }
        } catch (err: any) {
            console.error('Settings fetch catch:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (settings.default_price === '' || isNaN(Number(settings.default_price))) {
            toast.error(t('error'));
            return;
        }

        setSaving(true);

        // Update database
        const { error } = await supabase
            .from('settings')
            .upsert({ id: 1, ...settings, updated_at: new Date().toISOString() });

        if (error) {
            toast.error(t('error') + ': ' + error.message);
        } else {
            toast.success(t('success'));
        }
        setSaving(false);
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error(t('passwordMatchError'));
            return;
        }

        setSaving(true);
        try {
            // 1. Verify Current Password
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: passwordData.currentPassword
            });

            if (signInError) {
                toast.error("Mevcut şifre yanlış.");
                setSaving(false);
                return;
            }

            // 2. Update to New Password
            const { error } = await supabase.auth.updateUser({
                password: passwordData.newPassword
            });

            if (error) {
                toast.error('Şifre güncellenirken hata oluştu: ' + error.message);
            } else {
                toast.success('Şifre başarıyla güncellendi.');
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err: any) {
            toast.error("Bir hata oluştu.");
        } finally {
            setSaving(false);
        }
    };

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        const { error } = await supabase
            .from('profiles')
            .update({
                full_name: profile.full_name,
                avatar_url: profile.avatar_url
            })
            .eq('id', user.id);

        if (error) {
            toast.error('Profil güncellenirken hata oluştu: ' + error.message);
        } else {
            toast.success('Profil başarıyla güncellendi.');
        }
        setSaving(false);
    };

    const handleThemeChange = (theme: string) => {
        setSettings({ ...settings, active_theme: theme });
        setTheme(theme);
    };

    const handleLangChange = async (lang: string) => {
        setSettings({ ...settings, default_lang: lang });
        await setUserLocale(lang);
    };

    const tabs = [
        {
            id: 'general', name: t('general'), icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )
        },
        {
            id: 'music', name: t('music'), icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            )
        },
        {
            id: 'account', name: t('account'), icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            )
        }
    ];

    if (loading) return <SkeletonLoader />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-admin-text tracking-tight">{t('title')}</h1>
                    <p className="text-admin-text-muted mt-1">{t('description')}</p>
                </div>
                {activeTab !== 'account' && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 rounded-xl bg-admin-primary text-admin-bg font-bold hover:bg-admin-primary/90 transition-all shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-admin-bg/20 border-t-admin-bg rounded-full animate-spin"></div>
                                <span>Kaydediliyor...</span>
                            </>
                        ) : (
                            <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                                {t('save')}
                            </>
                        )}
                    </button>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="flex p-1.5 bg-admin-card rounded-2xl border border-admin-border w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-admin-primary text-admin-bg shadow-lg'
                            : 'text-admin-text-muted hover:text-admin-text hover:bg-admin-border/50'
                            }`}
                    >
                        {tab.icon}
                        {tab.name}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 gap-8">
                {activeTab === 'general' && (
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* Site Bilgileri */}
                        <div className="bg-admin-card rounded-3xl p-8 border border-admin-border space-y-6 shadow-xl leading-relaxed">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-admin-bg text-admin-primary border border-admin-border">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-admin-text">{t('siteInfo')}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('siteTitle')}</label>
                                    <input
                                        type="text"
                                        value={settings.site_title}
                                        onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('contactEmail')}</label>
                                    <input
                                        type="email"
                                        value={settings.contact_email}
                                        onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('whatsappNo')}</label>
                                    <input
                                        type="text"
                                        value={settings.whatsapp_no}
                                        onChange={(e) => setSettings({ ...settings, whatsapp_no: e.target.value })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Yasal Linkler (Ödeme sayfası) */}
                        <div className="bg-admin-card rounded-3xl p-8 border border-admin-border space-y-6 shadow-xl leading-relaxed md:col-span-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-admin-bg text-admin-primary border border-admin-border">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-admin-text">{t('legalLinks')}</h3>
                            </div>
                            <p className="text-sm text-admin-text-muted">{t('legalLinksDesc')}</p>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('linkPrivacyPolicy')}</label>
                                    <input
                                        type="url"
                                        value={settings.link_privacy_policy}
                                        onChange={(e) => setSettings({ ...settings, link_privacy_policy: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('linkDistanceSelling')}</label>
                                    <input
                                        type="url"
                                        value={settings.link_distance_selling}
                                        onChange={(e) => setSettings({ ...settings, link_distance_selling: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('linkDeliveryReturn')}</label>
                                    <input
                                        type="url"
                                        value={settings.link_delivery_return}
                                        onChange={(e) => setSettings({ ...settings, link_delivery_return: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('linkTermsConditions')}</label>
                                    <input
                                        type="url"
                                        value={settings.link_terms_conditions}
                                        onChange={(e) => setSettings({ ...settings, link_terms_conditions: e.target.value })}
                                        placeholder="https://..."
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sistem Durumu */}
                        <div className="bg-admin-card rounded-3xl p-8 border border-admin-border space-y-6 shadow-xl leading-relaxed">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-admin-bg text-admin-primary border border-admin-border">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-admin-text">{t('systemStatus')}</h3>
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-center justify-between p-4 bg-admin-bg rounded-2xl border border-admin-border">
                                    <div>
                                        <p className="font-bold text-admin-text">{t('maintenanceMode')}</p>
                                        <p className="text-xs text-admin-text-muted">{t('maintenanceDesc')}</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, is_maintenance_mode: !settings.is_maintenance_mode })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.is_maintenance_mode ? 'bg-admin-primary' : 'bg-admin-border'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.is_maintenance_mode ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider text-[10px]">{t('defaultLang')}</label>
                                        <select
                                            id="defaultLang"
                                            name="defaultLang"
                                            value={settings.default_lang}
                                            onChange={(e) => handleLangChange(e.target.value)}
                                            className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text appearance-none focus:outline-none focus:border-admin-primary/50 cursor-pointer font-medium"
                                        >
                                            <option value="tr">Türkçe (TR)</option>
                                            <option value="en">English (EN)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider text-[10px]">{t('theme')}</label>
                                        <select
                                            id="activeTheme"
                                            name="activeTheme"
                                            value={settings.active_theme}
                                            onChange={(e) => handleThemeChange(e.target.value)}
                                            className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text appearance-none focus:outline-none focus:border-admin-primary/50 cursor-pointer font-medium"
                                        >
                                            <option value="dark">Karanlık (Moon)</option>
                                            <option value="light">Aydınlık (Sun)</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="text-[10px] text-admin-text-muted italic text-center">{t('themeDesc')}</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'music' && (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-admin-card rounded-3xl p-8 border border-admin-border space-y-8 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-admin-bg text-admin-primary border border-admin-border">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-admin-text">{t('pricing')}</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('defaultPrice')}</label>
                                    <input
                                        type="number"
                                        value={settings.default_price}
                                        onChange={(e) => setSettings({ ...settings, default_price: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('currency')}</label>
                                    <select
                                        id="currency"
                                        name="currency"
                                        value={settings.currency}
                                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 appearance-none cursor-pointer font-medium"
                                    >
                                        <option value="TL">{t('currencies.TL')}</option>
                                        <option value="USD">{t('currencies.USD')}</option>
                                        <option value="EUR">{t('currencies.EUR')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-admin-card rounded-3xl p-8 border border-admin-border space-y-8 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-admin-bg text-admin-primary border border-admin-border">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-admin-text">{t('security')}</h3>
                            </div>

                            <div className="bg-admin-bg rounded-2xl p-6 border border-admin-border space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-admin-text leading-tight">{t('watermarkStatus')}</p>
                                        <p className="text-xs text-admin-text-muted mt-1 max-w-[240px]">{t('watermarkDesc')}</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, is_watermark_active: !settings.is_watermark_active })}
                                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.is_watermark_active ? 'bg-green-500' : 'bg-admin-border'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.is_watermark_active ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="max-w-4xl mx-auto w-full space-y-8">
                        {/* Profile Info */}
                        <form onSubmit={handleProfileUpdate} className="bg-admin-card rounded-3xl p-8 border border-admin-border space-y-8 shadow-xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-admin-bg text-admin-primary border border-admin-border">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-admin-text">{t('profileTitle') || 'Profil Bilgileri'}</h3>
                                </div>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-6 py-2.5 rounded-xl bg-admin-primary text-admin-bg font-bold hover:bg-admin-primary/90 transition-all shadow-lg disabled:opacity-50"
                                >
                                    {saving ? '...' : t('save')}
                                </button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">Admin İsim/Soyisim</label>
                                    <input
                                        type="text"
                                        value={profile.full_name}
                                        onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                        placeholder="Ad Soyad"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">Profil Fotoğrafı URL</label>
                                    <input
                                        type="text"
                                        value={profile.avatar_url}
                                        onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                        placeholder="https://example.com/photo.jpg"
                                    />
                                </div>
                            </div>
                        </form>

                        {/* Password Change */}
                        <form onSubmit={handlePasswordUpdate} className="bg-admin-card rounded-3xl p-8 border border-admin-border space-y-8 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-admin-bg text-admin-primary border border-admin-border">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-admin-text">{t('passwordTitle')}</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('currentPassword')}</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('newPassword')}</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-admin-text-muted tracking-wider">{t('confirmPassword')}</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full bg-admin-bg border border-admin-border rounded-xl px-4 py-3.5 text-admin-text focus:outline-none focus:border-admin-primary/50 transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 rounded-xl bg-admin-primary text-admin-bg font-bold hover:bg-admin-primary/90 transition-all shadow-lg disabled:opacity-50"
                            >
                                {saving ? t('passwordUpdating') : t('passwordUpdate')}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
