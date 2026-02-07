"use client";

import React, { createContext, useContext, useState, useCallback } from 'react';

export interface FavoriteTrack {
    id: string | number;
    title: string;
    artist_name: string;
    preview_url: string;
    price?: number;
    currency?: string;
    image_url?: string;
    bpm?: number;
    genres?: { name: string };
    category_id?: number;
    mode_id?: number;
    status?: string;
    categories?: { name: string };
    modes?: { name: string };
}

interface FavoritesContextType {
    favorites: FavoriteTrack[];
    addFavorite: (track: FavoriteTrack) => void;
    removeFavorite: (trackId: string | number) => void;
    isFavorite: (trackId: string | number) => boolean;
    toggleFavorite: (track: FavoriteTrack) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

const STORAGE_KEY = 'mba-favorites';

function loadFromStorage(): FavoriteTrack[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch {
        return [];
    }
}

function saveToStorage(items: FavoriteTrack[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {}
}

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);

    const hydrate = useCallback(() => {
        setFavorites(loadFromStorage());
    }, []);

    React.useEffect(() => {
        hydrate();
    }, [hydrate]);

    const addFavorite = useCallback((track: FavoriteTrack) => {
        setFavorites(prev => {
            if (prev.some(t => t.id === track.id)) return prev;
            const next = [...prev, track];
            saveToStorage(next);
            return next;
        });
    }, []);

    const removeFavorite = useCallback((trackId: string | number) => {
        setFavorites(prev => {
            const next = prev.filter(t => t.id !== trackId);
            saveToStorage(next);
            return next;
        });
    }, []);

    const isFavorite = useCallback((trackId: string | number) => {
        return favorites.some(t => t.id === trackId);
    }, [favorites]);

    const toggleFavorite = useCallback((track: FavoriteTrack) => {
        setFavorites(prev => {
            const exists = prev.some(t => t.id === track.id);
            const next = exists ? prev.filter(t => t.id !== track.id) : [...prev, track];
            saveToStorage(next);
            return next;
        });
    }, []);

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addFavorite,
                removeFavorite,
                isFavorite,
                toggleFavorite
            }}
        >
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
