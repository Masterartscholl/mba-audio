import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Wix origin check
    const origin = request.headers.get('origin');
    const allowedOrigins = ['https://www.muzikburada.net', 'https://mba-audio.vercel.app'];

    if (origin && allowedOrigins.includes(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-client-info, apikey');
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: response.headers,
        });
    }

    return response;
}

export const config = {
    matcher: ['/api/:path*', '/auth/:path*'],
};
