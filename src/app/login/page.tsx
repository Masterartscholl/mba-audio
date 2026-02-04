"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            router.push('/admin');
        } catch (err: any) {
            setError(err.message || 'Giriş yapılırken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0b1121] flex items-center justify-center p-4 font-sans antialiased">
            <div className="w-full max-w-md">
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-10">
                    <div className="w-16 h-16 rounded-2xl bg-[#ede066] flex items-center justify-center shadow-[0_0_30px_rgba(237,224,102,0.3)] mb-4">
                        <svg className="w-10 h-10 text-[#0b1121]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">MBA AUDIO</h1>
                    <p className="text-slate-500 mt-2">Yönetim Paneline Giriş Yapın</p>
                </div>

                {/* Login Form */}
                <div className="bg-[#151e32] border border-[#1e293b] rounded-3xl p-8 shadow-2xl">
                    <form onSubmit={handleLogin} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm text-center">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">E-posta</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
                                    </svg>
                                </span>
                                <input
                                    required
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="admin@mbaaudio.com"
                                    className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Şifre</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </span>
                                <input
                                    required
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all font-medium"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#ede066] hover:bg-[#d4c95b] text-[#0b1121] font-bold py-4 rounded-xl shadow-[0_4px_20px_rgba(237,224,102,0.2)] hover:shadow-[0_4px_30px_rgba(237,224,102,0.4)] transition-all flex items-center justify-center gap-2 transform active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="w-6 h-6 border-3 border-[#0b1121]/20 border-t-[#0b1121] rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span>Giriş Yap</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer Link */}
                <p className="text-center text-slate-600 mt-8 text-sm">
                    Sisteme erişim için yetkili olmanız gerekmektedir.
                </p>
            </div>
        </div>
    );
}
