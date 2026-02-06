"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/home/Sidebar';
import { Header } from '@/components/home/Header';
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
    <div className="flex h-screen bg-[#0b1121] overflow-hidden selection:bg-[#3b82f6]/30">
      {/* Left Sidebar */}
      <Sidebar onFilterChange={setFilters} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 flex flex-col overflow-hidden">
          <TrackList filters={filters} currency={currency} />
        </main>
      </div>

      {/* Global Bottom Player */}
      <GlobalPlayer />
    </div>
  );
}
