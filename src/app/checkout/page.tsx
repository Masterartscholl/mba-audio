"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';

export default function CheckoutPage() {
    const t = useTranslations('App');
    const { items } = useCart();
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [billingName, setBillingName] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [billingCity, setBillingCity] = useState('');
    const [billingCountry, setBillingCountry] = useState('TR');
    const [acceptTerms, setAcceptTerms] = useState(false);

    const total = items.reduce((s, t) => s + (t.price ?? 0), 0);
    const currency = items[0]?.currency || 'TL';

    const formatCardNumber = (v: string) => {
        const digits = v.replace(/\D/g, '').slice(0, 16);
        return digits.replace(/(.{4})/g, '$1 ').trim();
    };

    const formatExpiry = (v: string) => {
        const digits = v.replace(/\D/g, '').slice(0, 4);
        if (digits.length >= 2) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
        return digits;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // İyzico entegrasyonu backend'de yapılacak
    };

    return (
        <div className="min-h-screen bg-[#0b1121] text-white selection:bg-[#3b82f6]/30">
            {/* Header */}
            <header className="h-20 border-b border-white/5 px-6 lg:px-10 flex items-center justify-between sticky top-0 bg-[#0b1121]/90 backdrop-blur-xl z-50">
                <Link href="/" className="flex items-center shrink-0">
                    <div className="w-10 h-10 bg-[#3b82f6] rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                    </div>
                </Link>
                <Link
                    href="/"
                    className="text-sm font-bold text-[#64748b] hover:text-[#ede066] uppercase tracking-widest transition-colors"
                >
                    ← {t('backToCart')}
                </Link>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
                <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase mb-2">{t('paymentTitle')}</h1>
                <p className="text-[#64748b] text-sm font-bold uppercase tracking-widest mb-10">
                    {t('paymentSubtitle')}
                </p>

                <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-10">
                    {/* Sol: Form */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Kart Bilgileri */}
                        <div className="bg-[#131b2e] rounded-2xl p-6 lg:p-8 border border-white/5">
                            <h2 className="text-xs font-black text-[#ede066] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]" />
                                {t('cardDetails')}
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-[#64748b] uppercase tracking-widest mb-2">{t('cardNumber')}</label>
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                        maxLength={19}
                                        className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ede066]/50 transition-all font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-[#64748b] uppercase tracking-widest mb-2">{t('cardName')}</label>
                                    <input
                                        type="text"
                                        placeholder="AD SOYAD"
                                        value={cardName}
                                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                        className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ede066]/50 transition-all uppercase"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-[#64748b] uppercase tracking-widest mb-2">{t('expiry')}</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={expiry}
                                            onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                                            maxLength={5}
                                            className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ede066]/50 transition-all font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-[#64748b] uppercase tracking-widest mb-2">CVC</label>
                                        <input
                                            type="text"
                                            placeholder="***"
                                            value={cvc}
                                            onChange={(e) => setCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                            maxLength={4}
                                            className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ede066]/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fatura Bilgileri */}
                        <div className="bg-[#131b2e] rounded-2xl p-6 lg:p-8 border border-white/5">
                            <h2 className="text-xs font-black text-[#ede066] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]" />
                                {t('billingDetails')}
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-[#64748b] uppercase tracking-widest mb-2">{t('billingName')}</label>
                                    <input
                                        type="text"
                                        placeholder="Fatura adı"
                                        value={billingName}
                                        onChange={(e) => setBillingName(e.target.value)}
                                        className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ede066]/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-[#64748b] uppercase tracking-widest mb-2">{t('address')}</label>
                                    <textarea
                                        placeholder="Tam adres"
                                        value={billingAddress}
                                        onChange={(e) => setBillingAddress(e.target.value)}
                                        rows={3}
                                        className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ede066]/50 transition-all resize-none"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-[#64748b] uppercase tracking-widest mb-2">{t('city')}</label>
                                        <input
                                            type="text"
                                            placeholder="İstanbul"
                                            value={billingCity}
                                            onChange={(e) => setBillingCity(e.target.value)}
                                            className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#ede066]/50 transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-[#64748b] uppercase tracking-widest mb-2">{t('country')}</label>
                                        <select
                                            value={billingCountry}
                                            onChange={(e) => setBillingCountry(e.target.value)}
                                            className="w-full bg-[#0b1121] border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-[#ede066]/50 transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="TR">Türkiye</option>
                                            <option value="US">ABD</option>
                                            <option value="DE">Almanya</option>
                                            <option value="GB">İngiltere</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-white/20 bg-[#0b1121] text-[#ede066] focus:ring-[#ede066]/50"
                            />
                            <span className="text-xs text-[#94a3b8] group-hover:text-white transition-colors">
                                {t('termsAccept')}
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={items.length === 0}
                            className="w-full py-4 rounded-xl bg-[#ede066] text-[#0b1121] text-sm font-black uppercase tracking-widest hover:bg-[#f5e85c] active:scale-[0.99] transition-all shadow-lg shadow-[#ede066]/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {t('payButton')}
                        </button>
                    </div>

                    {/* Sağ: Sipariş Özeti */}
                    <div className="lg:col-span-2">
                        <div className="bg-[#131b2e] rounded-2xl p-6 border border-white/5 sticky top-28">
                            <h2 className="text-xs font-black text-[#64748b] uppercase tracking-[0.2em] mb-4">{t('orderSummary')}</h2>
                            {items.length === 0 ? (
                                <p className="text-sm text-[#64748b] font-bold">{t('cartEmptyCheckout')}</p>
                            ) : (
                                <>
                                    <ul className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                                        {items.map(t => (
                                            <li key={t.id} className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-white truncate max-w-[180px]">{t.title}</span>
                                                <span className="text-[#ede066] font-black shrink-0">{formatPrice(t.price ?? 0, currency)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                                        <span className="text-sm font-bold text-[#64748b] uppercase">{t('total')}</span>
                                        <span className="text-xl font-black text-[#ede066]">{formatPrice(total, currency)}</span>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
