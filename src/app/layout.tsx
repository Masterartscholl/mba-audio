import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthRefreshSync } from "@/components/AuthRefreshSync";
import { ProfileCompleteGuard } from "@/components/ProfileCompleteGuard";
import { MaintenanceGuard } from "@/components/MaintenanceGuard";
import { CustomerGuard } from "@/components/CustomerGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MusicBank MBA",
  description: "Music Library Management",
};

import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/context/AuthContext";
import { AudioProvider } from "@/context/AudioContext";
import { CartProvider } from "@/context/CartContext";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { SearchProvider } from "@/context/SearchContext";
import { Toaster } from 'sonner';

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            try {
              var locale = localStorage.getItem('NEXT_LOCALE');
              var currentUrl = new URL(window.location.href);
              if (locale && !currentUrl.searchParams.has('locale') && !currentUrl.searchParams.has('lang') && window.self !== window.top) {
                currentUrl.searchParams.set('locale', locale);
                window.location.replace(currentUrl.toString());
              }
            } catch (e) {}
          })();
        ` }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages} locale={locale}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <AudioProvider>
                <CartProvider>
                  <FavoritesProvider>
                    <SearchProvider>
                      <Suspense fallback={null}>
                        <AuthRefreshSync />
                      </Suspense>
                      <ProfileCompleteGuard />
                      <MaintenanceGuard />
                      <CustomerGuard />
                      {children}
                      <Toaster position="top-right" richColors theme="dark" />
                    </SearchProvider>
                  </FavoritesProvider>
                </CartProvider>
              </AudioProvider>
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
