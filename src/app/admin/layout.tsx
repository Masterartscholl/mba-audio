import React from 'react';
import { Sidebar } from '@/components/admin/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#0b1121] text-white font-sans flex antialiased">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto w-full">
                <div className="max-w-6xl mx-auto space-y-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
