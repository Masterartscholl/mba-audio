import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = 'NEXT_LOCALE';
const DEFAULT_LOCALE = 'tr';

export function middleware(request: NextRequest) {
    const { nextUrl, cookies } = request;

    // 1. Check query parameter first (highest priority, useful for iframe/Wix)
    let locale: string | null | undefined = nextUrl.searchParams.get('lang') || nextUrl.searchParams.get('locale');

    // 2. If no query param, check cookie
    if (!locale) {
        locale = cookies.get(COOKIE_NAME)?.value;
    }

    // 3. Fallback to default
    if (!locale || !['tr', 'en'].includes(locale)) {
        locale = DEFAULT_LOCALE;
    }

    const response = NextResponse.next();

    // Try to persist in cookie if it came from query param
    if (nextUrl.searchParams.has('lang') || nextUrl.searchParams.has('locale')) {
        response.cookies.set(COOKIE_NAME, locale, {
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'none',
            secure: true
        });
    }

    // Pass the locale to the app via a header that getRequestConfig can read
    // We use a custom header because getRequestConfig doesn't have access to searchParams
    response.headers.set('x-next-locale', locale);

    return response;
}

export const config = {
    // Apply middleware to all routes except api, static files, etc.
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
