"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
    url: string;
    isPlaying: boolean;
    onReady?: () => void;
}

export const TrackWaveform: React.FC<WaveformProps> = ({ url, isPlaying }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        if (!containerRef.current) return;

        let ws: WaveSurfer | null = null;

        try {
            ws = WaveSurfer.create({
                container: containerRef.current,
                waveColor: 'rgba(237, 224, 102, 0.2)',
                progressColor: '#ede066',
                cursorColor: 'transparent',
                barWidth: 2,
                barGap: 3,
                height: 32,
                normalize: true,
                interact: false,
            });

            ws.load(url).catch(err => {
                if (err.name === 'AbortError') return;
                console.error('WaveSurfer Load Error:', err);
            });

            ws.on('ready', () => setReady(true));
            wavesurferRef.current = ws;
        } catch (err) {
            console.error('WaveSurfer Creation Error:', err);
        }

        return () => {
            if (ws) {
                ws.destroy();
            }
        };
    }, [url]);

    useEffect(() => {
        if (!wavesurferRef.current || !ready) return;

        // This is a mockup sync. For full sync, we'd need shared state.
        // For now, we just show a static colored bar if it's the active track but not playing,
        // or let it animate if we had a way to sync it.
    }, [isPlaying, ready]);

    return (
        <div className="w-48 h-10 flex items-center">
            <div ref={containerRef} className="w-full" />
            {!ready && <div className="w-full h-1 bg-white/5 animate-pulse rounded-full" />}
        </div>
    );
};
