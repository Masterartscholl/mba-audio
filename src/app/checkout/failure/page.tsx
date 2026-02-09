"use client";

import Link from 'next/link';

export default function CheckoutFailurePage() {
  return (
    <div className="min-h-screen bg-app-bg flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-app-card border border-red-500/40 rounded-3xl p-8 text-center shadow-xl">
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-red-500/10 border border-red-500/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.2" />
            <path
              d="M9 9l6 6M15 9l-6 6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-black text-app-text uppercase tracking-[0.25em] mb-3">
          Ödeme Başarısız
        </h1>
        <p className="text-sm text-app-text-muted mb-6">
          İşleminiz tamamlanamadı. Kart bilgilerinizde veya banka onayında bir sorun olabilir.
          Lütfen tekrar deneyin veya farklı bir kart kullanın.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/checkout"
            className="w-full py-3.5 rounded-xl bg-app-primary text-app-primary-foreground font-black text-sm uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
          >
            Tekrar Dene
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

