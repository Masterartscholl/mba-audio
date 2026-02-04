import React from 'react';
import { Sidebar } from '@/components/admin/Sidebar';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-admin-bg text-admin-text font-sans flex antialiased transition-colors duration-300">
            <Sidebar />
            <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto w-full">
                <div className="max-w-6xl mx-auto space-y-10">
                    {children}
                </div>
            </main>
        </div>
    );
}
