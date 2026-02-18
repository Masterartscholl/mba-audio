"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { formatPrice } from '@/utils/format';
import { ThemeSwitcher } from '@/components/home/ThemeSwitcher';
import { LanguageSwitcher } from '@/components/home/LanguageSwitcher';
import logoImg from '@/images/logo.png';

const DEFAULT_LINKS = {
    link_privacy_policy: 'https://www.muzikburada.net/services-7',
    link_distance_selling: 'https://www.muzikburada.net/mesafeli-sat%C4%B1%C5%9F-s%C3%B6zle%C5%9Fmesi',
    link_delivery_return: 'https://www.muzikburada.net/teslimat-ve-iade',
    link_terms_conditions: 'https://www.muzikburada.net/%C5%9Fartlar-ve-ko%C5%9Fullar'
};

export default function CheckoutPage() {
    const router = useRouter();
    const t = useTranslations('App');
    const { items } = useCart();
    const [billingName, setBillingName] = useState('');
    const [billingTcId, setBillingTcId] = useState('');
    const [billingAddress, setBillingAddress] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [billingErrors, setBillingErrors] = useState<{ billingName?: string; billingTcId?: string; billingAddress?: string }>({});
    const [legalLinks, setLegalLinks] = useState<typeof DEFAULT_LINKS>(DEFAULT_LINKS);
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);

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

    const closePaymentForm = useCallback(() => {
        // Overlay'i kaldır
        const overlay = document.getElementById('iyzipay-overlay');
        if (overlay) {
            overlay.remove();
        }

        // İyzipay'ın enjekte ettiği iframe'leri kaldır
        document.querySelectorAll('iframe[src*="iyzipay"], iframe[id*="iyzipay"]').forEach((iframe) => {
            iframe.remove();
        });

        // İyzipay'ın enjekte ettiği script'leri kaldır
        document.querySelectorAll('script[src*="iyzipay"]').forEach((script) => {
            script.remove();
        });

        // İyzipay'ın eklediği style'ları kaldır
        document.querySelectorAll('link[href*="iyzipay"]').forEach((link) => {
            link.remove();
        });

        // İyzipay global objesini sıfırla (varsa)
        if ((window as any).iyzipay) {
            delete (window as any).iyzipay;
        }

        // Body'den iyzipay class'ını kaldır
        document.body.classList.remove('iyzipay-checkout-open');

        setIsPaymentOpen(false);
    }, []);

    // Mobil geri tuşu desteği
    useEffect(() => {
        if (!isPaymentOpen) return;

        const handlePopState = () => {
            closePaymentForm();
            // Geçmişe gitmek yerine, ödeme formunu sadece kapat
            window.history.pushState(null, '', window.location.href);
        };

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('popstate', handlePopState);
        };
    }, [isPaymentOpen, closePaymentForm]);

    const total = items.reduce((s, t) => s + (t.price ?? 0), 0);
    const currency = items[0]?.currency || 'TL';

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

    const validateBillingForm = (): boolean => {
        const err: { billingName?: string; billingTcId?: string; billingAddress?: string } = {};

        if (!billingName.trim()) {
            err.billingName = t('billingErrorNameRequired');
        }

        if (billingTcId.length !== 11) {
            err.billingTcId = t('billingErrorTcIdRequired');
        } else if (!isValidTcId(billingTcId)) {
            err.billingTcId = t('billingErrorTcIdInvalid');
        }

        if (!billingAddress.trim() || billingAddress.trim().length < 10) {
            err.billingAddress = t('billingErrorAddressRequired');
        }
        setBillingErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateBillingForm()) return;
        if (!acceptTerms) return;
        setBillingErrors({});

        try {
            const res = await fetch('/api/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map((t) => t.id),
                }),
            });

            if (!res.ok) {
                console.error('Payment init failed', await res.text());
                return;
            }

            const data = await res.json();
            console.log('IYZIPAY INIT RESPONSE', data);
            if (data.checkoutFormContent) {
                // 0) Eski iyzipay form'unu temizle (iptal sonrası yeniden deneme durumu)
                const existingOverlay = document.getElementById('iyzipay-overlay');
                if (existingOverlay) {
                    existingOverlay.remove();
                }
                
                // İyzipay'ın enjekte ettiği iframe'leri önceden kaldır
                document.querySelectorAll('iframe[src*="iyzipay"], iframe[id*="iyzipay"]').forEach((iframe) => {
                    iframe.remove();
                });

                // 1) Sayfanın üzerine basit bir overlay ve hedef div ekle
                let overlay = document.getElementById('iyzipay-overlay') as HTMLDivElement | null;
                if (!overlay) {
                    overlay = document.createElement('div');
                    overlay.id = 'iyzipay-overlay';
                    overlay.style.position = 'fixed';
                    overlay.style.inset = '0';
                    overlay.style.background = 'rgba(0,0,0,0.75)';
                    overlay.style.zIndex = '9999';
                    overlay.style.display = 'flex';
                    overlay.style.alignItems = 'center';
                    overlay.style.justifyContent = 'center';
                    overlay.style.padding = '16px';
                    overlay.style.overflowY = 'auto';

                    const panel = document.createElement('div');
                    panel.style.background = '#ffffff';
                    panel.style.borderRadius = '16px';
                    panel.style.maxWidth = '480px';
                    panel.style.width = '100%';
                    panel.style.margin = 'auto';
                    panel.style.padding = '8px';
                    panel.style.position = 'relative';

                    // Kapatma butonu
                    const closeButton = document.createElement('button');
                    closeButton.innerHTML = '✕';
                    closeButton.style.position = 'absolute';
                    closeButton.style.top = '12px';
                    closeButton.style.right = '12px';
                    closeButton.style.width = '32px';
                    closeButton.style.height = '32px';
                    closeButton.style.borderRadius = '50%';
                    closeButton.style.border = 'none';
                    closeButton.style.background = 'rgba(0,0,0,0.1)';
                    closeButton.style.color = '#000';
                    closeButton.style.fontSize = '20px';
                    closeButton.style.cursor = 'pointer';
                    closeButton.style.display = 'flex';
                    closeButton.style.alignItems = 'center';
                    closeButton.style.justifyContent = 'center';
                    closeButton.style.zIndex = '10001';
                    closeButton.style.transition = 'background 0.2s';
                    closeButton.style.fontWeight = 'bold';

                    closeButton.onmouseover = () => {
                        closeButton.style.background = 'rgba(0,0,0,0.2)';
                    };
                    closeButton.onmouseout = () => {
                        closeButton.style.background = 'rgba(0,0,0,0.1)';
                    };

                    closeButton.onclick = (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        closePaymentForm();
                    };

                    const formDiv = document.createElement('div');
                    formDiv.id = 'iyzipay-checkout-form';
                    formDiv.style.minHeight = '520px';
                    formDiv.innerHTML = ''; // Önceki içeriği temizle

                    panel.appendChild(closeButton);
                    panel.appendChild(formDiv);
                    overlay.appendChild(panel);
                    document.body.appendChild(overlay);
                }

                // 2) checkoutFormContent içindeki <script> kodunu alıp gerçek script tag olarak ekle
                const raw = String(data.checkoutFormContent);
                const scriptContent = raw
                    .replace(/^\s*<script[^>]*>/i, '')
                    .replace(/<\/script>\s*$/i, '');

                const scriptTag = document.createElement('script');
                scriptTag.type = 'text/javascript';
                scriptTag.innerHTML = scriptContent;
                document.body.appendChild(scriptTag);

                // State'i güncelle
                setIsPaymentOpen(true);

                // Formun görünmesi için sayfanın üstüne kaydır
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        } catch (err) {
            console.error('Payment submit error:', err);
        }
    };

    return (
        <div className="min-h-screen bg-app-bg text-app-text selection:bg-[#3b82f6]/30">
            {/* Header */}
            <header className="h-14 sm:h-20 border-b border-app-border px-4 sm:px-6 lg:px-10 flex items-center justify-between sticky top-0 bg-app-bg/90 backdrop-blur-xl z-50">
                <Link href="/" className="flex items-center shrink-0">
                    <Image src={logoImg} alt="MüzikBank" width={32} height={32} className="rounded-xl object-contain sm:w-10 sm:h-10" />
                </Link>
                <div className="flex items-center gap-2 sm:gap-4">
                    <ThemeSwitcher />
                    <LanguageSwitcher />
                    <Link
                        href="/"
                        className="text-xs sm:text-sm font-bold text-app-text-muted hover:text-app-primary uppercase tracking-widest transition-colors"
                    >
                        <span className="hidden sm:inline">← {t('backToCart')}</span>
                        <span className="sm:hidden">←</span>
                    </Link>
                </div>
            </header>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-16">
                <h1 className="text-2xl lg:text-4xl font-black text-app-text tracking-tighter uppercase mb-2">{t('paymentTitle')}</h1>
                <p className="text-app-text-muted text-xs lg:text-sm font-bold uppercase tracking-widest mb-6 lg:mb-10">
                    {t('paymentSubtitle')}
                </p>

                <form onSubmit={handleSubmit} className="grid lg:grid-cols-5 gap-6 lg:gap-10">
                    {/* Sol: Fatura ve onaylar */}
                    <div className="lg:col-span-3 space-y-5 lg:space-y-8">
                        {/* Fatura Bilgileri (İyzico ödeme ve fatura oluşturma için) */}
                        <div className="bg-app-card rounded-2xl p-4 sm:p-6 lg:p-8 border border-app-border">
                            <h2 className="text-xs font-black text-app-primary uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                                <span className="w-1 h-1 rounded-full bg-[#ede066]" />
                                {t('billingDetails')}
                            </h2>
                            <div className="space-y-4 lg:space-y-5">
                                <div>
                                    <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">{t('billingFullName')}</label>
                                    <input
                                        type="text"
                                        placeholder={t('billingFullNamePlaceholder')}
                                        value={billingName}
                                        onChange={(e) => {
                                            setBillingName(e.target.value);
                                            setBillingErrors(prev => ({ ...prev, billingName: undefined }));
                                        }}
                                        className={`w-full bg-app-input-bg border rounded-xl px-4 py-3.5 text-app-text placeholder:text-app-text-muted focus:outline-none transition-all ${billingErrors.billingName ? 'border-red-500/60 focus:border-red-500/60' : 'border-app-border focus:border-app-primary/50'}`}
                                    />
                                    {billingErrors.billingName && (
                                        <p className="mt-1.5 text-[11px] text-red-400 font-medium">{billingErrors.billingName}</p>
                                    )}
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
                                        className={`w-full bg-app-input-bg border rounded-xl px-4 py-3.5 text-app-text placeholder:text-app-text-muted focus:outline-none transition-all font-mono ${billingErrors.billingTcId ? 'border-red-500/60 focus:border-red-500/60' : 'border-app-border focus:border-app-primary/50'}`}
                                    />
                                    {billingErrors.billingTcId && <p className="mt-1.5 text-[11px] text-red-400 font-medium">{billingErrors.billingTcId}</p>}
                                </div>
                                <div>
                                    <label className="block text-[11px] font-black text-app-text-muted uppercase tracking-widest mb-2">{t('billingAddress')}</label>
                                    <textarea
                                        placeholder={t('billingAddressPlaceholder')}
                                        value={billingAddress}
                                        onChange={(e) => {
                                            setBillingAddress(e.target.value);
                                            setBillingErrors(prev => ({ ...prev, billingAddress: undefined }));
                                        }}
                                        rows={3}
                                        className={`w-full bg-app-input-bg border rounded-xl px-4 py-3.5 text-app-text placeholder:text-app-text-muted focus:outline-none transition-all resize-none ${billingErrors.billingAddress ? 'border-red-500/60 focus:border-red-500/60' : 'border-app-border focus:border-app-primary/50'}`}
                                    />
                                    {billingErrors.billingAddress && (
                                        <p className="mt-1.5 text-[11px] text-red-400 font-medium">{billingErrors.billingAddress}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bilgilendirme: Kart bilgileri iyzico güvenli ödeme penceresinde alınır */}
                        <div className="bg-app-card rounded-2xl p-4 border border-dashed border-app-border text-xs text-app-text-muted">
                            <p className="font-bold uppercase tracking-[0.18em] mb-1 text-app-text">
                                {t('cardInfoTitle')}
                            </p>
                            <p>
                                {t('cardInfoDescription')}
                            </p>
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
                        <div className="bg-app-card rounded-2xl p-4 sm:p-6 border border-app-border lg:sticky lg:top-28">
                            <h2 className="text-xs font-black text-app-text-muted uppercase tracking-[0.2em] mb-4">{t('orderSummary')}</h2>
                            {items.length === 0 ? (
                                <p className="text-sm text-app-text-muted font-bold">{t('cartEmptyCheckout')}</p>
                            ) : (
                                <>
                                    <ul className="space-y-3 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
                                        {items.map(t => (
                                            <li key={t.id} className="flex justify-between items-center text-sm">
                                                <span className="font-bold text-app-text truncate max-w-[180px]">{t.title}</span>
                                                <span className="text-app-primary font-black shrink-0">{formatPrice(t.price ?? 0, currency)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="border-t border-app-border pt-4 flex justify-between items-center">
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
