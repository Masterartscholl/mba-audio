"use client";

import React, { useMemo } from 'react';

interface WaveformProps {
    /** Audio dosyasının URL'i (preview_url) - artık kullanılmıyor */
    url?: string;
    /** Parça şu anda çalıyor mu? */
    isPlaying?: boolean;
    /** Mevcut ilerleme (saniye cinsinden) */
    progress?: number;
    /** Parça süresi */
    duration?: number;
    /** Etkinleştir/devre dışı bırak */
    enabled?: boolean;
}

// Simple hash function to generate consistent random-looking numbers from string
function hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

// Seeded random number generator
function seededRandom(seed: number): () => number {
    let state = seed;
    return () => {
        state = (state * 1664525 + 1013904223) % 4294967296;
        return state / 4294967296;
    };
}

/**
 * Basit ve performanslı waveform göstergesi.
 * Lazy loading ile uyumlu - audio yüklemez, sadece görsel gösterir.
 */
export const TrackWaveform: React.FC<WaveformProps> = ({
    url = '',
    isPlaying = false,
    progress,
    duration,
    enabled = true
}) => {
    // Generate static bars based on URL (won't change on re-render)
    const bars = useMemo(() => {
        const seed = hashString(url);
        const random = seededRandom(seed);

        return Array.from({ length: 40 }, (_, i) => ({
            id: i,
            height: 30 + random() * 70, // 30-100% height
        }));
    }, [url]);

    if (!enabled) {
        return <div className="w-full h-8 lg:h-10" />;
    }

    // Calculate progress percentage
    const progressPercent = duration && progress ? (progress / duration) * 100 : 0;

    return (
        <div className="relative w-full h-8 lg:h-10 flex items-center gap-[2px] overflow-hidden rounded-lg bg-app-surface/30 px-2">
            {bars.map((bar) => (
                <div
                    key={bar.id}
                    className="flex-1 rounded-sm transition-all duration-300"
                    style={{
                        height: `${bar.height}%`,
                        backgroundColor: (bar.id / bars.length) * 100 <= progressPercent
                            ? '#ede066' // Primary color for played portion
                            : '#4a4a4a', // Gray for unplayed
                        opacity: isPlaying && (bar.id / bars.length) * 100 <= progressPercent ? 1 : 0.6,
                    }}
                />
            ))}
        </div>
    );
};
