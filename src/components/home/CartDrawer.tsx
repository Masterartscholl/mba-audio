"use client";

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useCart } from '@/context/CartContext';
import { TrackWaveform } from './TrackWaveform';
import { formatPrice } from '@/utils/format';

export const CartDrawer: React.FC = () => {
    const t = useTranslations('App');
    const { items, isOpen, closeCart, removeItem, totalCount } = useCart();

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={closeCart}
                aria-hidden
            />

            {/* Drawer */}
            <div
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0a] border-l border-white/10 shadow-2xl z-[120] flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-label={t('cart')}
            >
                <div className="h-20 px-6 flex items-center justify-between border-b border-white/5 shrink-0">
                    <h2 className="text-lg font-black text-white uppercase tracking-tight">{t('cart')}</h2>
                    <button
                        onClick={closeCart}
                        className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-[#94a3b8] hover:text-white transition-all"
                        aria-label={t('close')}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-[#64748b]">
                            <svg className="w-14 h-14 opacity-30 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            <p className="text-sm font-bold uppercase tracking-widest">{t('cartEmpty')}</p>
                            <p className="text-xs mt-1">{t('cartEmptyHint')}</p>
                        </div>
                    ) : (
                        items.map(track => (
                            <div
                                key={track.id}
                                className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-all group"
                            >
                                <div className="w-12 flex-shrink-0">
                                    <div className="w-10 h-10 rounded-lg bg-[#ede066]/10 border border-[#ede066]/20 flex items-center justify-center">
                                        <svg className="w-5 h-5 text-[#ede066]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" /></svg>
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-white uppercase tracking-tight truncate">{track.title}</h4>
                                    <p className="text-[10px] font-bold text-[#64748b] uppercase tracking-widest truncate">{track.artist_name || 'Unknown'}</p>
                                    <div className="mt-2 w-40 h-8 overflow-hidden rounded">
                                        <TrackWaveform url={track.preview_url} isPlaying={false} />
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 shrink-0">
                                    {track.price != null && (
                                        <span className="text-[11px] font-black text-[#ede066]">{formatPrice(track.price, track.currency || 'TL')}</span>
                                    )}
                                    <button
                                        onClick={() => removeItem(track.id)}
                                        className="text-[10px] font-bold text-[#64748b] hover:text-red-400 uppercase tracking-wider transition-colors"
                                    >
                                        {t('remove')}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer - Ödemeye Geç (çalma barı yüksekliği kadar üstte) */}
                {items.length > 0 && (
                    <div className="p-6 pb-[7rem] border-t border-white/5 bg-[#111111]/80 shrink-0">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-xs font-bold text-[#64748b] uppercase tracking-widest">{totalCount} {t('items')}</span>
                            <span className="text-sm font-black text-white">
                                {t('total')}: {formatPrice(items.reduce((s, t) => s + (t.price ?? 0), 0), items[0]?.currency || 'TL')}
                            </span>
                        </div>
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            className="block w-full py-4 rounded-xl bg-[#ede066] text-[#0b1121] text-center text-sm font-black uppercase tracking-widest hover:bg-[#f5e85c] active:scale-[0.98] transition-all shadow-lg shadow-[#ede066]/20"
                        >
                            {t('checkout')}
                        </Link>
                    </div>
                )}
            </div>
        </>
    );
};
