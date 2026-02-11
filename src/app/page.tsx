"use client";

import React, { useState, useEffect } from 'react';
import { Sidebar, SidebarMobileDrawer } from '@/components/home/Sidebar';
import { Header } from '@/components/home/Header';
import { CategoryBar } from '@/components/home/CategoryBar';
import { TrackList } from '@/components/home/TrackList';
import { GlobalPlayer } from '@/components/home/GlobalPlayer';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [filters, setFilters] = useState<any>({});
  const [currency, setCurrency] = useState('TL');
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('currency').eq('id', 1).single();
    if (data) setCurrency(data.currency);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-app-bg overflow-hidden selection:bg-[#3b82f6]/30">
      {/* Left Sidebar */}
      <Sidebar filters={filters} onFilterChange={setFilters} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />
        <CategoryBar
          filters={filters}
          onFilterChange={setFilters}
          onCategoryNameChange={setSelectedCategoryName}
        />

        <main className="flex-1 flex flex-col overflow-hidden">
          <TrackList filters={filters} currency={currency} selectedCategoryName={selectedCategoryName} />
        </main>
      </div>

      {/* Global Bottom Player */}
      <GlobalPlayer />

      {/* Mobile Sidebar Drawer */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-[120] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileSidebarOpen(false)}
            aria-label="Close filters"
          />
          <div className="absolute left-0 top-0 h-full w-4/5 max-w-xs bg-app-bg shadow-2xl border-r border-app-border">
            <SidebarMobileDrawer
              filters={filters}
              onFilterChange={setFilters}
              onClose={() => setIsMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
