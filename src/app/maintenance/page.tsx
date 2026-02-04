import React from 'react';

export default function MaintenancePage() {
    return (
        <div className="min-h-screen bg-[#0b1121] flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-[#ede066]/10 blur-3xl rounded-full"></div>
                    <div className="relative bg-[#151e32] border border-[#1e293b] p-10 rounded-[40px] shadow-2xl">
                        <div className="w-20 h-20 bg-[#ede066]/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-[#ede066]/20">
                            <svg className="w-10 h-10 text-[#ede066]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-4 tracking-tight">Bakım Arası</h1>
                        <p className="text-slate-400 text-lg leading-relaxed">
                            Size daha iyi bir deneyim sunmak için şu anda sistem üzerinde iyileştirmeler yapıyoruz. Kısa süre sonra tekrar buradayız.
                        </p>
                        <div className="mt-10 pt-8 border-t border-slate-800">
                            <p className="text-slate-500 text-sm">Anlayışınız için teşekkür ederiz.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
