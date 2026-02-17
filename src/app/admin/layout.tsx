import { Sidebar } from '@/components/admin/Sidebar';
import { AdminGuard } from '@/components/admin/AdminGuard';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            <div className="h-screen overflow-hidden bg-admin-bg text-admin-text font-sans flex antialiased transition-colors duration-300">
                <Sidebar />
                <main className="flex-1 min-h-0 p-6 md:p-10 lg:p-12 overflow-y-auto overflow-x-hidden custom-scrollbar w-full">
                    <div className="max-w-6xl mx-auto space-y-10">
                        {children}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}
