"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

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

interface CartContextType {
    items: CartTrack[];
    isOpen: boolean;
    addItem: (track: CartTrack) => void;
    removeItem: (trackId: string | number) => void;
    openCart: () => void;
    closeCart: () => void;
    toggleCart: () => void;
    totalCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [items, setItems] = useState<CartTrack[]>([]);
    const [isOpen, setIsOpen] = useState(false);

    const addItem = useCallback((track: CartTrack) => {
        setItems(prev => {
            if (prev.some(t => t.id === track.id)) return prev;
            return [...prev, track];
        });
    }, []);

    const removeItem = useCallback((trackId: string | number) => {
        setItems(prev => prev.filter(t => t.id !== trackId));
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
