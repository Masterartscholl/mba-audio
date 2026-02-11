"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const CART_STORAGE_KEY = 'mba-cart';
const CART_TTL_MS = 24 * 60 * 60 * 1000; // 24 saat

export interface CartTrack {
    id: string | number;
    title: string;
    artist_name: string;
    preview_url: string;
    price?: number;
    currency?: string;
    image_url?: string;
    bpm?: number;
    genres?: { name: string };
}

interface StoredCart {
    items: CartTrack[];
    expiresAt: number;
}

interface CartContextType {
    items: CartTrack[];
    isOpen: boolean;
    addItem: (track: CartTrack) => void;
    removeItem: (trackId: string | number) => void;
    clearCart: () => void;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function loadCartFromStorage(): CartTrack[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(CART_STORAGE_KEY);
        if (!raw) return [];
        const parsed: StoredCart = JSON.parse(raw);
        if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
            localStorage.removeItem(CART_STORAGE_KEY);
            return [];
        }
        return Array.isArray(parsed.items) ? parsed.items : [];
    } catch {
        return [];
    }
}

function saveCartToStorage(items: CartTrack[]) {
    if (typeof window === 'undefined') return;
    try {
        const payload: StoredCart = {
            items,
            expiresAt: Date.now() + CART_TTL_MS,
        };
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(payload));
    } catch {
        // ignore
    }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartTrack[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [hydrated, setHydrated] = useState(false);

    useEffect(() => {
        setItems(loadCartFromStorage());
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        saveCartToStorage(items);
    }, [items, hydrated]);

    const addItem = useCallback((track: CartTrack) => {
        setItems(prev => {
            if (prev.some(t => t.id === track.id)) return prev;
            return [...prev, track];
        });
        setIsOpen(true);
    }, []);

    const removeItem = useCallback((trackId: string | number) => {
        setItems(prev => prev.filter(t => t.id !== trackId));
    }, []);

    const clearCart = useCallback(() => {
        setItems([]);
    }, []);

    const openCart = useCallback(() => setIsOpen(true), []);
    const closeCart = useCallback(() => setIsOpen(false), []);
    const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

    return (
        <CartContext.Provider
            value={{
                items,
                isOpen,
                addItem,
                removeItem,
                clearCart,
                openCart,
                closeCart,
                toggleCart,
                totalCount: items.length
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
