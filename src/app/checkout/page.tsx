"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import { ThemeSwitcher } from '@/components/home/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/home/LanguageSwitcher';
import logoImg from '@/images/logo.jpg';

const DEFAULT_LINKS = {
    link_privacy_policy: 'https://www.muzikburada.net/services-7',
    link_distance_selling: 'https://www.muzikburada.net/mesafeli-sat%C4%B1%C5%9F-s%C3%B6zle%C5%9Fmesi',
    link_delivery_return: 'https://www.muzikburada.net/teslimat-ve-iade',
    link_terms_conditions: 'https://www.muzikburada.net/%C5%9Fartlar-ve-ko%C5%9Fullar'
};

export default function CheckoutPage() {
    const t = useTranslations('App');
    const { items } = useCart();
    const [cardNumber, setCardNumber] = useState('');
    const [cardName, setCardName] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');
    const [billingName, setBillingName] = useState('');
    const [billingTcId, setBillingTcId] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [cardErrors, setCardErrors] = useState<{ cardNumber?: string; cardName?: string; expiry?: string; cvc?: string }>({});
    const [billingErrors, setBillingErrors] = useState<{ billingTcId?: string }>({});
    const [legalLinks, setLegalLinks] = useState<typeof DEFAULT_LINKS>(DEFAULT_LINKS);

    useEffect(() => {
        fetch('/api/settings/links')
            .then((res) => res.ok ? res.json() : {})
            .then((data: Record<string, string | null>) => {
                setLegalLinks({
                    link_privacy_policy: (data.link_privacy_policy && data.link_privacy_policy.trim()) ? data.link_privacy_policy.trim() : DEFAULT_LINKS.link_privacy_policy,
                    link_distance_selling: (data.link_distance_selling && data.link_distance_selling.trim()) ? data.link_distance_selling.trim() : DEFAULT_LINKS.link_distance_selling,
                    link_delivery_return: (data.link_delivery_return && data.link_delivery_return.trim()) ? data.link_delivery_return.trim() : DEFAULT_LINKS.link_delivery_return,
                    link_terms_conditions: (data.link_terms_conditions && data.link_terms_conditions.trim()) ? data.link_terms_conditions.trim() : DEFAULT_LINKS.link_terms_conditions
                });
            })
            .catch(() => {});
    }, []);

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

    const formatTcId = (v: string) => v.replace(/\D/g, '').slice(0, 11);

    /** TC Kimlik No doğrulama (11 hane, resmi algoritma) */
    const isValidTcId = (tc: string): boolean => {
        const d = tc.replace(/\D/g, '');
        if (d.length !== 11) return false;
        if (d[0] === '0') return false;
        const digits = d.split('').map(Number);
        let d10 = ((digits[0] + digits[2] + digits[4] + digits[6] + digits[8]) * 7 - (digits[1] + digits[3] + digits[5] + digits[7])) % 10;
        if (d10 < 0) d10 += 10;
        if (digits[9] !== d10) return false;
        const d11 = digits.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
        return digits[10] === d11;
    };

    /** Luhn algoritması ile kart numarası doğrulama */
    const isLuhnValid = (value: string): boolean => {
        const digits = value.replace(/\D/g, '');
        if (digits.length < 13 || digits.length > 19) return false;
        let sum = 0;
        let isEven = false;
        for (let i = digits.length - 1; i >= 0; i--) {
            let d = parseInt(digits[i], 10);
            if (isEven) {
                d *= 2;
                if (d > 9) d -= 9;
            }
            sum += d;
            isEven = !isEven;
        }
        return sum % 10 === 0;
    };

    /** Son kullanma tarihi geçerli mi (MM/YY, gelecek veya bu ay) */
    const isExpiryValid = (value: string): boolean => {
        const digits = value.replace(/\D/g, '');
        if (digits.length !== 4) return false;
        const month = parseInt(digits.slice(0, 2), 10);
        const year = 2000 + parseInt(digits.slice(2, 4), 10);
        if (month < 1 || month > 12) return false;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        return true;
    };

    const validateCardForm = (): boolean => {
        const err: typeof cardErrors = {};
        const rawCard = cardNumber.replace(/\D/g, '');
        if (rawCard.length < 13) {
            err.cardNumber = t('cardErrorNumberRequired');
        } else if (!isLuhnValid(cardNumber)) {
            err.cardNumber = t('cardErrorNumberInvalid');
        }
        const nameTrim = cardName.trim();
        if (nameTrim.length < 2) {
            err.cardName = t('cardErrorNameRequired');
        } else if (!/^[\p{L}\p{M}\s.'-]+$/u.test(nameTrim)) {
            err.cardName = t('cardErrorNameInvalid');
        }
        if (expiry.replace(/\D/g, '').length !== 4) {
            err.expiry = t('cardErrorExpiryRequired');
        } else if (!isExpiryValid(expiry)) {
            err.expiry = t('cardErrorExpiryInvalid');
        }
        if (cvc.length < 3) {
            err.cvc = t('cardErrorCvcRequired');
        } else if (cvc.length !== 3 && cvc.length !== 4) {
            err.cvc = t('cardErrorCvcInvalid');
        }
        setCardErrors(err);
        return Object.keys(err).length === 0;
    };

    const validateBillingForm = (): boolean => {
        const err: { billingTcId?: string } = {};
        if (billingTcId.length !== 11) {
            err.billingTcId = t('billingErrorTcIdRequired');
        } else if (!isValidTcId(billingTcId)) {
            err.billingTcId = t('billingErrorTcIdInvalid');
        }
        setBillingErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateCardForm()) return;
        if (!validateBillingForm()) return;
        setCardErrors({});
        setBillingErrors({});
        // İyzico entegrasyonu: cardNumber, cardName, expiry, cvc + fatura bilgileri (billingName, billingTcId, billingAddress) backend'e gönderilecek, ödeme alınıp fatura oluşturulacak
    };

    return (
        <div className="min-h-screen bg-app-bg text-app-text selection:bg-[#3b82f6]/30">
            {/* Header */}
            <header className="h-20 border-b border-app-border px-6 lg:px-10 flex items-center justify-between sticky top-0 bg-app-bg/90 backdrop-blur-xl z-50">
                <Link href="/" className="flex items-center shrink-0">
                    <Image src={logoImg} alt="MüzikBank" width={40} height={40} className="rounded-xl object-contain" />
                </Link>
                <div className="flex items-center gap-4">
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                    <Link
                        href="/"
                        className="text-sm font-bold text-app-text-muted hover:text-app-primary uppercase tracking-widest transition-colors"
                    >
                        ← {t('backToCart')}
                    </Link>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-6 py-12 lg:py-16">
                <h1 className="text-3xl lg:text-4xl font-black text-app-text tracking-tighter uppercase mb-2">{t('paymentTitle')}</h1>
                <p className="text-app-text-muted text-sm font-bold uppercase tracking-widest mb-10">
                    {t('paymentSubtitle')}
                </p>

                <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-10">
                    {/* Sol: Form */}
                    <div className="lg:col-span-3 space-y-8">
                        {/* Kart Bilgileri */}
                        <div className="bg-app-card rounded-2xl p-6 lg:p-8 border border-app-border">
                            <h2 className="text-xs font-black text-app-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]" />
                                {t('cardDetails')}
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">{t('cardNumber')}</label>
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        value={cardNumber}
                                        onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); setCardErrors(prev => ({ ...prev, cardNumber: undefined })); }}
                                        maxLength={19}
                                        className={`w-full bg-app-input-bg border rounded-xl px-4 py-3.5 text-white placeholder:text-app-text-muted focus:outline-none transition-all font-mono text-sm ${cardErrors.cardNumber ? 'border-red-500/60 focus:border-red-500/60' : 'border-white/10 focus:border-app-primary/50'}`}
                                    />
                                    {cardErrors.cardNumber && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{cardErrors.cardNumber}</p>}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">{t('cardName')}</label>
                                    <input
                                        type="text"
                                        placeholder="AD SOYAD"
                                        value={cardName}
                                        onChange={(e) => { setCardName(e.target.value.toUpperCase()); setCardErrors(prev => ({ ...prev, cardName: undefined })); }}
                                        className={`w-full bg-app-input-bg border rounded-xl px-4 py-3.5 text-white placeholder:text-app-text-muted focus:outline-none transition-all uppercase ${cardErrors.cardName ? 'border-red-500/60 focus:border-red-500/60' : 'border-white/10 focus:border-app-primary/50'}`}
                                    />
                                    {cardErrors.cardName && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{cardErrors.cardName}</p>}
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">{t('expiry')}</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            value={expiry}
                                            onChange={(e) => { setExpiry(formatExpiry(e.target.value)); setCardErrors(prev => ({ ...prev, expiry: undefined })); }}
                                            maxLength={5}
                                            className={`w-full bg-app-input-bg border rounded-xl px-4 py-3.5 text-white placeholder:text-app-text-muted focus:outline-none transition-all font-mono ${cardErrors.expiry ? 'border-red-500/60 focus:border-red-500/60' : 'border-white/10 focus:border-app-primary/50'}`}
                                        />
                                        {cardErrors.expiry && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{cardErrors.expiry}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">CVC</label>
                                        <input
                                            type="text"
                                            placeholder="***"
                                            value={cvc}
                                            onChange={(e) => { setCvc(e.target.value.replace(/\D/g, '').slice(0, 4)); setCardErrors(prev => ({ ...prev, cvc: undefined })); }}
                                            maxLength={4}
                                            className={`w-full bg-app-input-bg border rounded-xl px-4 py-3.5 text-white placeholder:text-app-text-muted focus:outline-none transition-all font-mono ${cardErrors.cvc ? 'border-red-500/60 focus:border-red-500/60' : 'border-white/10 focus:border-app-primary/50'}`}
                                        />
                                        {cardErrors.cvc && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{cardErrors.cvc}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Fatura Bilgileri (İyzico ödeme ve fatura oluşturma için) */}
                        <div className="bg-app-card rounded-2xl p-6 lg:p-8 border border-app-border">
                            <h2 className="text-xs font-black text-app-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]" />
                                {t('billingDetails')}
                            </h2>
                            <div className="space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">{t('billingFullName')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('billingFullNamePlaceholder')}
                                        value={billingName}
                                        onChange={(e) => setBillingName(e.target.value)}
                                        className="w-full bg-app-input-bg border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">{t('billingTcId')}</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder={t('billingTcIdPlaceholder')}
                                        value={billingTcId}
                                        onChange={(e) => { setBillingTcId(formatTcId(e.target.value)); setBillingErrors(prev => ({ ...prev, billingTcId: undefined })); }}
                                        maxLength={11}
                                        className={`w-full bg-app-input-bg border rounded-xl px-4 py-3.5 text-white placeholder:text-app-text-muted focus:outline-none transition-all font-mono ${billingErrors.billingTcId ? 'border-red-500/60 focus:border-red-500/60' : 'border-white/10 focus:border-app-primary/50'}`}
                                    />
                                    {billingErrors.billingTcId && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{billingErrors.billingTcId}</p>}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">{t('billingAddress')}</label>
                                    <textarea
                                        placeholder={t('billingAddressPlaceholder')}
                                        value={billingAddress}
                                        onChange={(e) => setBillingAddress(e.target.value)}
                                        rows={3}
                                        className="w-full bg-app-input-bg border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-app-text-muted focus:outline-none focus:border-app-primary/50 transition-all resize-none"
                                    />
                                </div>
                            </div>
                        </div>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="mt-1 w-4 h-4 rounded border-app-border bg-app-input-bg text-app-primary focus:ring-app-primary/50 shrink-0"
                            />
                            <span className="text-xs text-app-text-muted group-hover:text-app-text transition-colors">
                                {t('termsAcceptBeforeTerms')}
                                <a href={legalLinks.link_distance_selling} target="_blank" rel="noopener noreferrer" className="underline text-app-primary hover:opacity-90 font-bold transition-colors">{t('distanceSellingContract')}</a>
                                {t('termsAcceptComma')}
                                <a href={legalLinks.link_privacy_policy} target="_blank" rel="noopener noreferrer" className="underline text-app-primary hover:opacity-90 font-bold transition-colors">{t('privacyPolicy')}</a>
                                {t('termsAcceptComma')}
                                <a href={legalLinks.link_delivery_return} target="_blank" rel="noopener noreferrer" className="underline text-app-primary hover:opacity-90 font-bold transition-colors">{t('deliveryReturn')}</a>
                                {t('termsAcceptAnd')}
                                <a href={legalLinks.link_terms_conditions} target="_blank" rel="noopener noreferrer" className="underline text-app-primary hover:opacity-90 font-bold transition-colors">{t('termsAndConditions')}</a>
                                {t('termsAcceptAfter')}
                            </span>
                        </label>

                        <button
                            type="submit"
                            disabled={items.length === 0}
                            className="w-full py-4 rounded-xl bg-app-primary text-app-primary-foreground text-sm font-black uppercase tracking-widest hover:opacity-90 active:scale-[0.99] transition-all shadow-lg shadow-app-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                        >
                            {t('payButton')}
                        </button>
                    </div>

                    {/* Sağ: Sipariş Özeti */}
                    <div className="lg:col-span-2">
                        <div className="bg-app-card rounded-2xl p-6 border border-app-border sticky top-28">
                            <h2 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] mb-4">{t('orderSummary')}</h2>
                            {items.length === 0 ? (
                                <p className="text-sm text-app-text-muted font-bold">{t('cartEmptyCheckout')}</p>
                            ) : (
                                <>
                                    <ul className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                                        {items.map(t => (
                                            <li key={t.id} className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-white truncate max-w-[180px]">{t.title}</span>
                                                <span className="text-app-primary font-black shrink-0">{formatPrice(t.price ?? 0, currency)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                                        <span className="text-sm font-bold text-app-text-muted uppercase">{t('total')}</span>
                                        <span className="text-xl font-black text-app-primary">{formatPrice(total, currency)}</span>
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
