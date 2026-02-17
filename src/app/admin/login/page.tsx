"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { toast } from 'sonner';

export default function AdminLoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // If already logged in as admin, redirect to admin dashboard
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabaseAdmin.auth.getSession();
            if (session?.user) {
                // Check if actually an admin
                const { data: profile } = await supabaseAdmin
                    .from('profiles')
                    .select('is_admin')
                    .eq('id', session.user.id)
                    .single();

                if (profile?.is_admin) {
                    router.replace('/admin');
                } else {
                    await supabaseAdmin.auth.signOut();
                }
            }
        };
        checkSession();
    }, [router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const loginTimeout = setTimeout(() => {
            if (loading) {
                setLoading(false);
                toast.error('Giriş işlemi zaman aşımına uğradı. Lütfen sayfayı yenileyip tekrar deneyin.');
            }
        }, 10000);

        try {
            console.log('AdminLogin: Attempting sign in...');
            const { data, error } = await supabaseAdmin.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                toast.error('Giriş hatası: ' + error.message);
                setLoading(false);
                clearTimeout(loginTimeout);
                return;
            }

            console.log('AdminLogin: Sign in successful, checking profile...');
            // Check if user is an admin
            const { data: profile, error: profileError } = await supabaseAdmin
                .from('profiles')
                .select('is_admin')
                .eq('id', data.user.id)
                .single();

            if (profileError || !profile?.is_admin) {
                toast.error('Bu alana erişim yetkiniz yok.');
                await supabaseAdmin.auth.signOut();
                setLoading(false);
                clearTimeout(loginTimeout);
                return;
            }

            console.log('AdminLogin: Admin verified, redirecting...');
            toast.success('Başarıyla giriş yapıldı. Yönetim paneline aktarılıyorsunuz...');
            router.push('/admin');
        } catch (err: any) {
            console.error('AdminLogin: Unexpected error', err);
            toast.error('Bir hata oluştu: ' + err.message);
        } finally {
            clearTimeout(loginTimeout);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            <div className="max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#111] border border-white/5 rounded-3xl p-8 shadow-2xl">
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-black text-white tracking-tighter uppercase mb-2">Admin Girişi</h1>
                        <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">MüzikBank Yönetim Paneli</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">E-Posta</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white font-medium focus:outline-none focus:border-[#ede066]/50 transition-all"
                                placeholder="admin@muzikbank.net"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Şifre</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-black border border-white/5 rounded-2xl px-5 py-4 text-white font-medium focus:outline-none focus:border-[#ede066]/50 transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ede066] text-black py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#f5e85c] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#ede066]/10"
                        >
                            {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => router.push('/')}
                            className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors"
                        >
                            Siteye Geri Dön
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
