"use client";

import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface WaveformProps {
    url: string;
    isPlaying: boolean;
    /** Mevcut parça çalıyorsa, saniye cinsinden ilerleme */
    progress?: number;
    /** Parça süresi (saniye) */
    duration?: number;
    onReady?: () => void;
}

const WAVE_OPTIONS = {
    waveColor: 'rgba(237, 224, 102, 0.2)',
    progressColor: '#ede066',
    cursorColor: 'transparent',
    barWidth: 1,
    barGap: 0,
    height: 32,
    normalize: true,
    interact: false,
} as const;

/**
 * Çift katman: arka planda gri dalga, üstte sarı dalga.
 * Progress tamamen CSS width ile kontrol edilir (progressWrapperRef.style.width).
 * requestAnimationFrame ile oran güncellenir; WaveSurfer progress API'sine bağlı değil.
 */
export const TrackWaveform: React.FC<WaveformProps> = ({
    url,
    isPlaying,
    progress = 0,
    duration = 0,
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const progressWrapRef = useRef<HTMLDivElement>(null);
    const bgRef = useRef<HTMLDivElement>(null);
    const fgRef = useRef<HTMLDivElement>(null);
    const wsBgRef = useRef<WaveSurfer | null>(null);
    const wsFgRef = useRef<WaveSurfer | null>(null);
    const [ready, setReady] = useState(false);
    const [fullWidth, setFullWidth] = useState(0);
    const progressRef = useRef(0);
    const durationRef = useRef(0);
    /** Görüntülenen oran – hedefe doğru yumuşak geçiş (lerp) için */
    const displayRatioRef = useRef(0);

    progressRef.current = progress;
    durationRef.current = duration;

    // Container genişliğini ölç (sarı dalga hizası için)
    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;
        const update = () => setFullWidth(el.offsetWidth);
        update();
        const ro = new ResizeObserver(update);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // Arka plan (gri) dalga
    useEffect(() => {
        if (!bgRef.current) return;
        let ws: WaveSurfer | null = null;
        try {
            ws = WaveSurfer.create({
                ...WAVE_OPTIONS,
                container: bgRef.current,
                waveColor: 'rgba(237, 224, 102, 0.2)',
                progressColor: 'rgba(237, 224, 102, 0.2)',
            });
            ws.load(url).catch((err) => {
                if (err.name === 'AbortError') return;
                console.error('WaveSurfer Load Error:', err);
            });
            wsBgRef.current = ws;
        } catch (err) {
            console.error('WaveSurfer Creation Error:', err);
        }
        return () => {
            ws?.destroy();
            wsBgRef.current = null;
        };
    }, [url]);

    // Ön plan (sarı) dalga – aynı URL, sadece renk farklı; kırpma üst div'de
    useEffect(() => {
        if (!fgRef.current) return;
        let ws: WaveSurfer | null = null;
        try {
            ws = WaveSurfer.create({
                ...WAVE_OPTIONS,
                container: fgRef.current,
                waveColor: '#ede066',
                progressColor: '#ede066',
            });
            ws.load(url).catch((err) => {
                if (err.name === 'AbortError') return;
                console.error('WaveSurfer Load Error:', err);
            });
            ws.on('ready', () => setReady(true));
            wsFgRef.current = ws;
        } catch (err) {
            console.error('WaveSurfer Creation Error:', err);
        }
        return () => {
            ws?.destroy();
            wsFgRef.current = null;
        };
    }, [url]);

    // Akıcı progress: lerp ile yumuşak geçiş + GPU dostu stil
    const LERP = 0.35; // 0–1 arası; büyük = daha hızlı takip, küçük = daha yumuşak
    useEffect(() => {
        const wrap = progressWrapRef.current;
        if (!wrap) return;

        if (duration <= 0) {
            wrap.style.width = '0%';
            displayRatioRef.current = 0;
            return;
        }

        wrap.style.willChange = 'width';
        wrap.style.transform = 'translateZ(0)';

        let rafId: number;
        const tick = () => {
            const d = durationRef.current;
            const p = progressRef.current;
            const target = d > 0 ? Math.min(1, Math.max(0, p / d)) : 0;
            let current = displayRatioRef.current;
            current += (target - current) * LERP;
            if (Math.abs(target - current) < 0.001) current = target;
            displayRatioRef.current = current;
            wrap.style.width = `${current * 100}%`;
            rafId = requestAnimationFrame(tick);
        };
        rafId = requestAnimationFrame(tick);
        return () => {
            cancelAnimationFrame(rafId);
            wrap.style.willChange = '';
            wrap.style.transform = '';
        };
    }, [duration]);

    return (
        <div ref={wrapperRef} className="relative w-full h-10 flex items-center">
            {/* Arka plan: gri dalga (tam genişlik) */}
            <div ref={bgRef} className="absolute inset-0 w-full h-full" />

            {/* Progress: sarı dalga, sadece width kadar görünür; will-change ile akıcı animasyon */}
            <div
                ref={progressWrapRef}
                className="absolute left-0 top-0 h-full overflow-hidden z-[1]"
                style={{
                    width: duration > 0 ? `${Math.min(1, Math.max(0, progress / duration)) * 100}%` : '0%',
                    willChange: 'width',
                    transform: 'translateZ(0)',
                }}
            >
                <div
                    ref={fgRef}
                    className="h-full absolute left-0 top-0"
                    style={{ width: fullWidth ? `${fullWidth}px` : '100%' }}
                />
            </div>

            {!ready && (
                <div className="absolute inset-0 w-full h-1 bg-white/5 animate-pulse rounded-full my-auto" />
            )}
        </div>
    );
};
