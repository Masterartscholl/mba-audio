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
    const { user } = useAuth();
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
                // Get favorites from DB
                const { data, error } = await supabase
                    .from('user_favorites')
                    .select('track_id, tracks (*)')
                    .eq('user_id', user.id);

                if (error) {
                    // Table might not exist yet, ignore error and stay with local
                    console.warn('FavoritesContext: user_favorites table fetch error (expected if not created yet)', error);
                    return;
                }

                if (data) {
                    const dbFavs = data
                        .map((item: any) => item.tracks)
                        .filter(Boolean);

                    if (dbFavs.length > 0) {
                        setFavorites(dbFavs);
                        saveToStorage(dbFavs);
                    }
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
    }, [user]);

    const addFavorite = useCallback(async (track: FavoriteTrack) => {
        setFavorites(prev => {
            if (prev.some(t => t.id === track.id)) return prev;
            const next = [...prev, track];
            saveToStorage(next);
            return next;
        });

        if (user) {
            try {
                await supabase
                    .from('user_favorites')
                    .upsert({ user_id: user.id, track_id: track.id }, { onConflict: 'user_id,track_id' });
            } catch (e) {
                console.error('FavoritesContext: DB save error', e);
            }
        }
    }, [user]);

    const removeFavorite = useCallback(async (trackId: string | number) => {
        setFavorites(prev => {
            const next = prev.filter(t => t.id !== trackId);
            saveToStorage(next);
            return next;
        });

        if (user) {
            try {
                await supabase
                    .from('user_favorites')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('track_id', trackId);
            } catch (e) {
                console.error('FavoritesContext: DB delete error', e);
            }
        }
    }, [user]);

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
