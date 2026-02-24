"use client";

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function VerifyContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('Giriş onaylanıyor...');

    useEffect(() => {
        const code = searchParams.get('code');
        const next = searchParams.get('next') || '/';

        if (code) {
            supabase.auth.exchangeCodeForSession(code)
                .then(({ data, error }) => {
                    if (error) {
                        console.error('Exchange error:', error.message);
                        setStatus('Giriş başarısız: ' + error.message);
                        setTimeout(() => router.replace('/login'), 2000);
                    } else if (data?.session) {
                        // Save to localStorage specifically for AuthContext fallback
                        try {
                            localStorage.setItem('muzikbank-auth-token', JSON.stringify(data.session));
                        } catch (e) {
                            console.warn('LocalStorage write failed', e);
                        }

                        if (next === 'popup') {
                            setStatus('Giriş başarılı! Bilgiler aktarılıyor...');
                            if (window.opener) {
                                const access_token = data.session.access_token;
                                const refresh_token = data.session.refresh_token;

                                // Send session to parent iframe
                                window.opener.postMessage({
                                    type: 'oauth_session',
                                    access_token,
                                    refresh_token
                                }, '*');

                                // Wait for ACK from parent
                                const handleAck = (event: MessageEvent) => {
                                    if (event.data?.type === 'oauth_session_ack') {
                                        window.removeEventListener('message', handleAck);
                                        window.close();
                                    }
                                };
                                window.addEventListener('message', handleAck);

                                // Fallback close if no ACK
                                setTimeout(() => {
                                    window.close();
                                }, 3000);
                            } else {
                                // If no opener, just redirect to home
                                window.location.replace('/');
                            }
                        } else if (next.startsWith('http')) {
                            // If it's a cross-domain redirect (Wix), pass the tokens in the URL
                            // because cookies will likely be blocked in the iframe.
                            setStatus('Giriş başarılı! Wix sayfasına dönülüyor...');
                            const access_token = data.session.access_token;
                            const refresh_token = data.session.refresh_token;
                            const targetUrl = new URL(next);
                            targetUrl.hash = `access_token=${access_token}&refresh_token=${refresh_token}`;
                            window.location.replace(targetUrl.toString());
                        } else {
                            setStatus('Giriş başarılı! Yönlendiriliyorsunuz...');
                            // Full page reload to ensure all contexts pick up the new session
                            window.location.replace(next);
                        }
                    }
                })
                .catch(err => {
                    console.error('System error:', err);
                    setStatus('Bir sistem hatası oluştu.');
                });
        } else {
            router.replace('/');
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen bg-app-bg flex flex-col items-center justify-center p-4">
            <div className="w-12 h-12 border-4 border-app-primary/30 border-t-app-primary rounded-full animate-spin mb-4" />
            <p className="text-app-text font-bold text-lg text-center">{status}</p>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-app-bg flex items-center justify-center"><p className="text-app-text">Yükleniyor...</p></div>}>
            <VerifyContent />
        </Suspense>
    );
}
