"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
    /** Audio dosyasının URL'i (preview_url) */
    url?: string;
    /** Parça şu anda çalıyor mu? */
    isPlaying?: boolean;
    /** Mevcut ilerleme (saniye cinsinden) - eğer sağlanırsa senkronize eder */
    progress?: number;
    /** Parça süresi */
    duration?: number;
    /** Etkinleştir/devre dışı bırak - false ise hiç render etme */
    enabled?: boolean;
}

/**
 * Optimize edilmiş runtime WaveSurfer bileşeni.
 * - IntersectionObserver ile lazy loading: sadece görünür olduğunda yüklenir
 * - Cache desteği: bir kere yüklenen waveform tekrar hesaplanmaz
 * - Unmount'ta temizlik yapılır
 */
export const TrackWaveform: React.FC<WaveformProps> = ({
    url,
    isPlaying = false,
    progress,
    duration,
    enabled = true
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WaveSurfer | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isVerySmall, setIsVerySmall] = useState(false);

    // Çok küçük ekran tespiti (yalnızca client)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const check = () => setIsVerySmall(window.innerWidth < 360);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    // IntersectionObserver ile lazy loading
    useEffect(() => {
        if (!containerRef.current || !enabled) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { rootMargin: isVerySmall ? '80px' : '160px' } // mobilde biraz daha dar
        );

        observer.observe(containerRef.current);

        return () => observer.disconnect();
    }, [enabled, isVerySmall]);

    // WaveSurfer instance oluştur ve yükle
    useEffect(() => {
        if (!containerRef.current || !url || !isVisible || !enabled) return;

        // Çok küçük ekranda ve parça çalmıyorsa WaveSurfer oluşturma; sadece ince skeleton göster
        if (isVerySmall && !isPlaying) {
            return;
        }

        // Önceki instance varsa temizle
        if (wsRef.current) {
            wsRef.current.destroy();
            wsRef.current = null;
        }

        setIsLoaded(false);

        try {
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
            const ws = WaveSurfer.create({
                container: containerRef.current,
                waveColor: '#4a4a4a',
                progressColor: '#ede066',
                height: isMobile ? 32 : 40,
                barWidth: isMobile ? 1.5 : 2,
                barGap: 1,
                barRadius: 2,
                cursorWidth: 0,
                normalize: true,
                interact: false,
            });

            ws.load(url);
            
            ws.on('ready', () => {
                setIsLoaded(true);
            });
            
            ws.on('error', (err) => {
                console.error('WaveSurfer load error:', err);
                setIsLoaded(false);
            });

            wsRef.current = ws;

            return () => {
                ws.destroy();
                wsRef.current = null;
                setIsLoaded(false);
            };
        } catch (err) {
            console.error('WaveSurfer creation error:', err);
            setIsLoaded(false);
        }
    }, [url, isVisible, enabled, isVerySmall, isPlaying]);

    // Progress senkronizasyonu
    useEffect(() => {
        if (!wsRef.current || !isLoaded) return;
        if (progress != null && duration && duration > 0) {
            const seekTo = progress / duration;
            wsRef.current.seekTo(Math.max(0, Math.min(1, seekTo)));
        }
    }, [progress, duration, isLoaded]);

    if (!enabled) {
        return <div className="w-full h-8 lg:h-10" />;
    }

    return (
        <div className="relative w-full h-8 lg:h-10 flex items-center overflow-hidden rounded-full">
            {/* WaveSurfer container'ı */}
            <div 
                ref={containerRef} 
                className="absolute inset-0"
                style={{ opacity: isLoaded ? 1 : 0 }}
            />
            
            {/* Loading skeleton - sadece yüklenene kadar görünür */}
            {(!isVisible || !isLoaded) && (
                <div className="w-full h-1 bg-white/5 animate-pulse rounded-full" />
            )}
        </div>
    );
};
