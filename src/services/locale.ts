'use server';

import { cookies, headers } from 'next/headers';

const COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'tr';

export async function getUserLocale() {
    const headerList = await headers();
    const headersLocale = headerList.get('x-next-locale');
    if (headersLocale) return headersLocale;

    const cookieStore = await cookies();
    return cookieStore.get(COOKIE_NAME)?.value || DEFAULT_LOCALE;
}

export async function setUserLocale(locale: string) {
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, locale, { path: '/', maxAge: 60 * 60 * 24 * 365 });
}
