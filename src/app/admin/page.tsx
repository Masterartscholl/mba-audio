import React from 'react';

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-6 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-gray-400 mt-2">Müzik kütüphaneni yönet ve yeni eserler ekle.</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#171717] flex items-center justify-center border border-white/5 text-[#ede066]">
                    <span className="font-bold">A</span>
                </div>
            </div>
        </header>

        {/* Main Content - Upload Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Left Column: Metadata Inputs */}
            <div className="lg:col-span-1 space-y-6 bg-[#171717] p-6 md:p-8 rounded-3xl border border-white/5 shadow-2xl">
                <div className="flex items-center gap-2 mb-2">
                     <svg className="w-5 h-5 text-[#ede066]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="text-lg font-semibold text-white">Eser Bilgileri</h2>
                </div>
                
                {/* Eser Adı */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 block ml-1">Eser Adı</label>
                    <input 
                        type="text" 
                        placeholder="Örn: Midnight City" 
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all"
                    />
                </div>

                {/* Kategori Adı */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 block ml-1">Kategori Adı</label>
                    <div className="relative">
                        <select className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-5 py-4 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all cursor-pointer">
                            <option>Beat</option>
                            <option>Sosyal Medya</option>
                            <option>Film Müzikleri</option>
                            <option>Besteler</option>
                        </select>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                             </svg>
                        </div>
                    </div>
                </div>

                {/* Tür & BPM Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 block ml-1">Tür</label>
                        <div className="relative">
                            <select className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-4 py-4 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all cursor-pointer">
                                <option>Electronic</option>
                                <option>Cinematic</option>
                                <option>Hip Hop</option>
                            </select>
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                                 </svg>
                            </div>
                        </div>
                    </div>

                     <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-400 block ml-1">BPM</label>
                        <input 
                            type="number" 
                            placeholder="120" 
                            className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-4 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all"
                        />
                    </div>
                </div>

                 {/* Mod (Opsiyonel) */}
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 block ml-1">Mod (Opsiyonel)</label>
                    <div className="relative">
                         <select className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-5 py-4 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all cursor-pointer">
                            <option>Seçiniz...</option>
                            <option>Neşeli</option>
                            <option>Gerilim</option>
                            <option>Hareketli</option>
                            <option>Duygusal</option>
                        </select>
                         <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
                             </svg>
                        </div>
                    </div>
                </div>
                
                 {/* Key (Optional Based on visual but good to have) */}
                 <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-400 block ml-1">Key (Opsiyonel)</label>
                     <input 
                        type="text" 
                        placeholder="Örn: C Minor" 
                        className="w-full bg-[#0a0a0a] border border-white/5 rounded-2xl px-5 py-4 text-white placeholder-gray-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all"
                    />
                 </div>

            </div>

             {/* Right Column: File Uploads */}
             <div className="lg:col-span-2 flex flex-col h-full">
                <div className="flex items-center gap-2 mb-6">
                     <svg className="w-5 h-5 text-[#ede066]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                    <h2 className="text-lg font-semibold text-white">Medya Dosyaları</h2>
                </div>
                
                <div className="grid gap-6 flex-1">
                    {/* Filigranlı Ön İzleme Yükle */}
                    <div className="bg-[#171717] p-8 rounded-3xl border border-white/5 border-dashed border-2 flex flex-col items-center justify-center text-center hover:border-[#ede066]/50 hover:bg-[#1a1a1a] transition-all group cursor-pointer min-h-[240px]">
                        <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#ede066]/10 transition-all">
                            <svg className="w-8 h-8 text-[#ede066]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-white group-hover:text-[#ede066] transition-colors">Filigranlı Ön İzleme (Preview)</h3>
                        <p className="text-gray-500 text-sm mt-2 max-w-xs">Web sitesinde çalınacak, filigranlanmış düşük çözünürlüklü dosya.</p>
                        <div className="flex items-center gap-2 mt-4 text-xs font-mono text-gray-600 bg-[#0a0a0a] px-3 py-1 rounded-full">
                            <span>MP3</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span>Max 10MB</span>
                        </div>
                    </div>

                    {/* Ana Dosya Yükle */}
                    <div className="bg-[#171717] p-8 rounded-3xl border border-white/5 border-dashed border-2 flex flex-col items-center justify-center text-center hover:border-[#ede066]/50 hover:bg-[#1a1a1a] transition-all group cursor-pointer min-h-[240px]">
                        <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-[#ede066]/10 transition-all">
                             <svg className="w-8 h-8 text-[#ede066]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-white group-hover:text-[#ede066] transition-colors">Master Dosya (Main)</h3>
                        <p className="text-gray-500 text-sm mt-2 max-w-xs">Satın alma sonrası müşteriye iletilecek orijinal yüksek kaliteli dosya.</p>
                         <div className="flex items-center gap-2 mt-4 text-xs font-mono text-gray-600 bg-[#0a0a0a] px-3 py-1 rounded-full">
                            <span>WAV / MP3</span>
                            <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                            <span>Yüksek Kalite</span>
                        </div>
                    </div>
                </div>

                {/* Publish Button */}
                <div className="flex justify-end mt-8">
                    <button className="flex items-center gap-2 px-8 py-4 bg-[#ede066] hover:bg-[#d4c95b] text-black font-bold rounded-2xl transition-all transform active:scale-95 shadow-[0_4px_20px_rgba(237,224,102,0.2)] hover:shadow-[0_4px_30px_rgba(237,224,102,0.4)]">
                        <span>Eseri Yayınla</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                         </svg>
                    </button>
                    <button className="ml-4 px-8 py-4 text-gray-400 font-semibold hover:text-white transition-colors">
                        Vazgeç
                    </button>
                </div>

             </div>
        </div>

        {/* Empty Table Section */}
        <div className="bg-[#171717] rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-white">Son Eklenen Eserler</h2>
                <button className="text-sm text-[#ede066] hover:text-[#d4c95b] font-medium transition-colors">
                    Tümünü Gör
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-[#0a0a0a] text-xs uppercase font-medium text-gray-500">
                        <tr>
                            <th className="px-8 py-5">Eser Detayı</th>
                            <th className="px-8 py-5">Kategori</th>
                            <th className="px-8 py-5">Tür</th>
                            <th className="px-8 py-5">BPM</th>
                            <th className="px-8 py-5">Tarih</th>
                            <th className="px-8 py-5 text-right">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {/* Empty State */}
                         <tr>
                            <td colSpan={6} className="px-8 py-16 text-center">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="w-16 h-16 bg-[#262626] rounded-full flex items-center justify-center mb-4 text-gray-600">
                                         <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                                        </svg>
                                    </div>
                                    <p className="text-gray-400 font-medium">Henüz yüklenmiş bir eser bulunmuyor.</p>
                                    <p className="text-gray-600 text-sm mt-1">İlk eserinizi yukarıdaki formdan yükleyebilirsiniz.</p>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

      </div>
    </div>
  );
}
