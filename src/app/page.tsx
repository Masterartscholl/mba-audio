"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/home/Sidebar';
import { Header } from '@/components/home/Header';
import { CategoryBar } from '@/components/home/CategoryBar';
import { TrackList } from '@/components/home/TrackList';
import { GlobalPlayer } from '@/components/home/GlobalPlayer';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [filters, setFilters] = useState<any>({});
  const [currency, setCurrency] = useState('TL');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('currency').eq('id', 1).single();
    if (data) setCurrency(data.currency);
  };

  return (
    <div className="flex h-screen bg-[#0a0a0a] overflow-hidden selection:bg-[#3b82f6]/30">
      {/* Left Sidebar */}
      <Sidebar filters={filters} onFilterChange={setFilters} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <CategoryBar filters={filters} onFilterChange={setFilters} />

        <main className="flex-1 flex flex-col overflow-hidden">
          <TrackList filters={filters} currency={currency} />
        </main>
      </div>

      {/* Global Bottom Player */}
      <GlobalPlayer />
    </div>
  );
}
