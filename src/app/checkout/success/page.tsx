"use client";

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');

  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-app-card border border-app-border rounded-3xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-app-primary/10 border border-app-primary/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-app-primary" viewBox="0 0 24 24" fill="none">
            <path
              d="M9 12.75L11.25 15L15 9.75"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-app-text uppercase tracking-[0.25em] mb-3">
          Ödeme Başarılı
        </h1>
        <p className="text-sm text-app-text-muted mb-4">
          Siparişiniz başarıyla alındı. Satın aldığınız parçalar kısa süre içinde kütüphanenize
          eklenecektir.
        </p>
        {orderId && (
          <p className="text-xs text-app-text-muted mb-6">
            Sipariş Numarası: <span className="font-semibold text-app-text">{orderId}</span>
          </p>
        )}
        <div className="flex flex-col gap-3">
          <Link
            href="/library"
            className="w-full py-3.5 rounded-xl bg-app-primary text-app-primary-foreground font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
          >
            Kütüphaneye Git
          </Link>
          <Link
            href="/"
            className="w-full py-3.5 rounded-xl bg-app-surface text-app-text font-bold text-xs uppercase tracking-[0.2em] border border-app-border hover:bg-app-card transition-colors"
          >
            Ana Sayfaya Dön
          </Link>
        </div>
      </div>
    </div>
  );
}

