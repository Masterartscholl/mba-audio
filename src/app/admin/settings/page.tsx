"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';

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
};

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<'general' | 'music' | 'account'>('general');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Settings State
    const [settings, setSettings] = useState<Settings>({
        site_title: '',
        contact_email: '',
        whatsapp_no: '',
        default_price: '',
        currency: 'TL',
        is_watermark_active: true,
        is_maintenance_mode: false,
        active_theme: 'dark',
        default_lang: 'tr'
    });

    // Password State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

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
                setNotification({ type: 'error', message: 'Ayarlar yüklenirken bir hata oluştu: ' + error.message });
            } else if (data) {
                setSettings(data);
            }
        } catch (err: any) {
            console.error('Settings fetch catch:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (settings.default_price === '' || isNaN(Number(settings.default_price))) {
            setNotification({ type: 'error', message: 'Varsayılan fiyat boş olamaz ve geçerli bir sayı olmalıdır.' });
            return;
        }

        setSaving(true);
        setNotification(null);

        const { error } = await supabase
            .from('settings')
            .upsert({ id: 1, ...settings });

        if (error) {
            setNotification({ type: 'error', message: 'Ayarlar güncellenirken hata oluştu: ' + error.message });
        } else {
            setNotification({ type: 'success', message: 'Ayarlar başarıyla güncellendi.' });
            setTimeout(() => setNotification(null), 3000);
        }
        setSaving(false);
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Yeni şifreler eşleşmiyor!');
            return;
        }

        setSaving(true);
        // Note: Supabase user update works specifically on the authenticated session
        const { error } = await supabase.auth.updateUser({
            password: passwordData.newPassword
        });

        if (error) {
            setNotification({ type: 'error', message: 'Şifre güncellenirken hata oluştu: ' + error.message });
        } else {
            setNotification({ type: 'success', message: 'Şifre başarıyla güncellendi.' });
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            setTimeout(() => setNotification(null), 3000);
        }
        setSaving(false);
    };

    const tabs = [
        {
            id: 'general', name: 'Genel', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            )
        },
        {
            id: 'music', name: 'Müzik Ayarları', icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
            )
        },
        {
            id: 'account', name: 'Hesap', icon: (
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
                    <h1 className="text-3xl font-bold text-white tracking-tight">Ayarlar</h1>
                    <p className="text-slate-400 mt-1">Platform genel yapılandırmasını buradan yönetin.</p>
                </div>
                {activeTab !== 'account' && (
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="px-8 py-3 rounded-xl bg-[#ede066] text-[#0b1121] font-bold hover:bg-[#d4c95b] transition-all shadow-[0_4px_20px_rgba(237,224,102,0.2)] disabled:opacity-50 flex items-center gap-2"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-[#0b1121]/20 border-t-[#0b1121] rounded-full animate-spin"></div>
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                        )}
                        Ayarları Kaydet
                    </button>
                )}
            </div>

            {/* Notification */}
            {notification && (
                <div className={`p-4 rounded-2xl border ${notification.type === 'success'
                    ? 'bg-green-500/10 border-green-500/20 text-green-500'
                    : 'bg-red-500/10 border-red-500/20 text-red-500'
                    } flex items-center gap-3 animate-in slide-in-from-top-4 duration-300`}>
                    {notification.type === 'success' ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    )}
                    <span className="font-medium text-sm">{notification.message}</span>
                </div>
            )}

            {/* Tabs Navigation */}
            <div className="flex p-1.5 bg-[#151e32] rounded-2xl border border-[#1e293b] w-fit">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-[#ede066] text-[#0b1121] shadow-lg'
                            : 'text-slate-400 hover:text-white hover:bg-[#1e293b]'
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
                        <div className="bg-[#151e32] rounded-3xl p-8 border border-[#1e293b] space-y-6 shadow-xl leading-relaxed">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-[#0b1121] text-[#ede066] border border-[#2A3B55]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Site Bilgileri</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Site Başlığı</label>
                                    <input
                                        type="text"
                                        value={settings.site_title}
                                        onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                                        className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">İletişim E-postası</label>
                                    <input
                                        type="email"
                                        value={settings.contact_email}
                                        onChange={(e) => setSettings({ ...settings, contact_email: e.target.value })}
                                        className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 transition-all"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">WhatsApp Numarası</label>
                                    <input
                                        type="text"
                                        value={settings.whatsapp_no}
                                        onChange={(e) => setSettings({ ...settings, whatsapp_no: e.target.value })}
                                        className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Sistem Durumu */}
                        <div className="bg-[#151e32] rounded-3xl p-8 border border-[#1e293b] space-y-6 shadow-xl leading-relaxed">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2.5 rounded-xl bg-[#0b1121] text-[#ede066] border border-[#2A3B55]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Sistem & Görünüm</h3>
                            </div>

                            <div className="space-y-5">
                                <div className="flex items-center justify-between p-4 bg-[#0b1121] rounded-2xl border border-[#2A3B55]">
                                    <div>
                                        <p className="font-bold text-white">Bakım Modu</p>
                                        <p className="text-xs text-slate-500">Aktif olduğunda site ziyaretçilere kapatılır.</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, is_maintenance_mode: !settings.is_maintenance_mode })}
                                        className={`w-12 h-6 rounded-full transition-colors relative ${settings.is_maintenance_mode ? 'bg-[#ede066]' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.is_maintenance_mode ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 opacity-50 cursor-not-allowed">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider text-[10px]">Varsayılan Dil</label>
                                        <select disabled className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none">
                                            <option>Türkçe (TR)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider text-[10px]">Tema</label>
                                        <select disabled className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none">
                                            <option>Karanlık (Moon)</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-500 italic text-center">* Dil ve tema seçenekleri bir sonraki güncellemede aktif edilecektir.</p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'music' && (
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="bg-[#151e32] rounded-3xl p-8 border border-[#1e293b] space-y-8 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[#0b1121] text-[#ede066] border border-[#2A3B55]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Global Fiyatlandırma</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Varsayılan Fiyat</label>
                                    <input
                                        type="number"
                                        value={settings.default_price}
                                        onChange={(e) => setSettings({ ...settings, default_price: e.target.value === '' ? '' : Number(e.target.value) })}
                                        className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 transition-all"
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Para Birimi</label>
                                    <select
                                        value={settings.currency}
                                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                                        className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 appearance-none cursor-pointer"
                                    >
                                        <option value="TL">Türk Lirası (₺)</option>
                                        <option value="USD">Amerikan Doları ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#151e32] rounded-3xl p-8 border border-[#1e293b] space-y-8 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[#0b1121] text-[#ede066] border border-[#2A3B55]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Güvenlik & Filigran</h3>
                            </div>

                            <div className="bg-[#0b1121] rounded-2xl p-6 border border-[#2A3B55] space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-white leading-tight">Filigran (Watermark) Durumu</p>
                                        <p className="text-xs text-slate-500 mt-1 max-w-[240px]">Aktif edildiğinde tüm ön izleme dosyalarına ses damgası eklenmiş sayılır.</p>
                                    </div>
                                    <button
                                        onClick={() => setSettings({ ...settings, is_watermark_active: !settings.is_watermark_active })}
                                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${settings.is_watermark_active ? 'bg-green-500' : 'bg-slate-700'}`}
                                    >
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${settings.is_watermark_active ? 'left-7' : 'left-1'}`}></div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'account' && (
                    <div className="max-w-2xl mx-auto w-full">
                        <form onSubmit={handlePasswordUpdate} className="bg-[#151e32] rounded-3xl p-8 border border-[#1e293b] space-y-8 shadow-xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 rounded-xl bg-[#0b1121] text-[#ede066] border border-[#2A3B55]">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                </div>
                                <h3 className="text-xl font-bold text-white">Şifre Değiştir</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Mevcut Şifre</label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordData.currentPassword}
                                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                        className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 transition-all"
                                    />
                                </div>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Yeni Şifre</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.newPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Yeni Şifre (Tekrar)</label>
                                        <input
                                            type="password"
                                            required
                                            value={passwordData.confirmPassword}
                                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full py-4 rounded-xl bg-[#ede066] text-[#0b1121] font-bold hover:bg-[#d4c95b] transition-all shadow-[0_4px_20px_rgba(237,224,102,0.2)] disabled:opacity-50"
                            >
                                {saving ? 'Şifre Güncelleniyor...' : 'Şifreyi Güncelle'}
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
