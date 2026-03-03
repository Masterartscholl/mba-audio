"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

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
    loading: boolean;
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
    } catch { }
}

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, authToken } = useAuth();
    const [favorites, setFavorites] = useState<FavoriteTrack[]>([]);
    const [loading, setLoading] = useState(true);

    const hydrate = useCallback(() => {
        setFavorites(loadFromStorage());
        setLoading(false);
    }, []);

    // Initial hydration from storage
    React.useEffect(() => {
        hydrate();
    }, [hydrate]);

    // DB Sync when user logs in
    React.useEffect(() => {
        const syncWithDb = async () => {
            if (!user) return;

            try {
                setLoading(true);
                const headers: Record<string, string> = {};
                if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

                const isWix = typeof window !== 'undefined' && window.location.origin.includes('muzikburada.net');
                const apiUrl = isWix ? 'https://mba-audio.vercel.app/api/me/favorites' : '/api/me/favorites';

                const res = await fetch(apiUrl, { headers });
                if (!res.ok) throw new Error(`API error: ${res.status}`);

                const { favorites: dbFavs, error } = await res.json();

                if (error) {
                    console.warn('FavoritesContext: API fetch error', error);
                    return;
                }

                if (dbFavs && Array.isArray(dbFavs)) {
                    setFavorites(dbFavs);
                    saveToStorage(dbFavs);
                }
            } catch (err) {
                console.error('FavoritesContext: Sync error', err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            syncWithDb();
        }
    }, [user, authToken]);

    const addFavorite = useCallback(async (track: FavoriteTrack) => {
        setFavorites(prev => {
            if (prev.some(t => t.id === track.id)) return prev;
            const next = [...prev, track];
            saveToStorage(next);
            return next;
        });

        if (user && authToken) {
            try {
                const isWix = typeof window !== 'undefined' && window.location.origin.includes('muzikburada.net');
                const apiUrl = isWix ? 'https://mba-audio.vercel.app/api/me/favorites' : '/api/me/favorites';

                await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${authToken}`
                    },
                    body: JSON.stringify({ trackId: track.id })
                });
            } catch (e) {
                console.error('FavoritesContext: API save error', e);
            }
        }
    }, [user, authToken]);

    const removeFavorite = useCallback(async (trackId: string | number) => {
        setFavorites(prev => {
            const next = prev.filter(t => t.id !== trackId);
            saveToStorage(next);
            return next;
        });

        if (user && authToken) {
            try {
                const isWix = typeof window !== 'undefined' && window.location.origin.includes('muzikburada.net');
                const apiUrl = isWix
                    ? `https://mba-audio.vercel.app/api/me/favorites?trackId=${trackId}`
                    : `/api/me/favorites?trackId=${trackId}`;

                await fetch(apiUrl, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
            } catch (e) {
                console.error('FavoritesContext: API delete error', e);
            }
        }
    }, [user, authToken]);

    const isFavorite = useCallback((trackId: string | number) => {
        return favorites.some(t => t.id === trackId);
    }, [favorites]);

    const toggleFavorite = useCallback(async (track: FavoriteTrack) => {
        const exists = favorites.some(t => t.id === track.id);
        if (exists) {
            await removeFavorite(track.id);
        } else {
            await addFavorite(track);
        }
    }, [favorites, addFavorite, removeFavorite]);

    return (
        <FavoritesContext.Provider
            value={{
                favorites,
                addFavorite,
                removeFavorite,
                isFavorite,
                toggleFavorite,
                loading
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
