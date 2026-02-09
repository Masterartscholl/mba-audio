import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { AuthRefreshSync } from "@/components/AuthRefreshSync";
import { ProfileCompleteGuard } from "@/components/ProfileCompleteGuard";

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
            <AudioProvider>
              <CartProvider>
                <FavoritesProvider>
                  <SearchProvider>
                    <Suspense fallback={null}>
                      <AuthRefreshSync />
                    </Suspense>
                    <ProfileCompleteGuard />
                    {children}
                    <Toaster position="top-right" richColors theme="dark" />
                  </SearchProvider>
                </FavoritesProvider>
              </CartProvider>
            </AudioProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
