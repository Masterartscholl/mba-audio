import React from 'react';

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Ayarlar</h1>
                <p className="text-slate-400 mt-1">Sistem ve kullanıcı ayarlarını buradan yapılandırabilirsiniz.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#151e32] rounded-3xl p-8 border border-[#1e293b]">
                    <h3 className="text-xl font-bold text-white mb-4">Profil Ayarları</h3>
                    <div className="space-y-4">
                        <div className="h-10 bg-[#0b1121] rounded-xl border border-[#2A3B55]"></div>
                        <div className="h-10 bg-[#0b1121] rounded-xl border border-[#2A3B55]"></div>
                    </div>
                </div>
                <div className="bg-[#151e32] rounded-3xl p-8 border border-[#1e293b]">
                    <h3 className="text-xl font-bold text-white mb-4">Sistem Tercihleri</h3>
                    <div className="space-y-4">
                        <div className="h-10 bg-[#0b1121] rounded-xl border border-[#2A3B55]"></div>
                        <div className="h-10 bg-[#0b1121] rounded-xl border border-[#2A3B55]"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
