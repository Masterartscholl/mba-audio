"use client";

import React, { useState } from 'react';

// Data Hierarchy based on user request and visual map
const HIERARCHY: Record<string, { genre: string, modes: string[] }[]> = {
    "Beat": [
        { genre: "Trap", modes: ["Hard", "Dark", "Melodic", "Heavy"] },
        { genre: "Drill", modes: ["UK Drill", "NY Drill", "Aggressive"] },
        { genre: "Afro", modes: ["Chill", "Dance", "Summer"] }
    ],
    "Sosyal Medya": [
        { genre: "Hareketli", modes: ["Neşeli", "Enerjik", "Pozitif", "Moda", "Vlog"] },
        { genre: "Slow", modes: ["Hüzünlü", "Duygusal", "Sinematik", "Sakin"] },
        { genre: "Marka", modes: ["Kurumsal", "Teknoloji", "Minimal", "İlham Verici"] }
    ],
    "Film Müzikleri": [
        { genre: "Aksiyon", modes: ["Heyecanlı", "Epik", "Kovalama", "Savaş"] },
        { genre: "Gerilim", modes: ["Korku", "Gizem", "Karanlık", "Gergin"] },
        { genre: "Komedi", modes: ["Eğlenceli", "Şakacı", "Hafif", "Garip"] },
        { genre: "Romantik", modes: ["Aşk", "Duygusal", "Umutlu", "Nostaljik"] },
        { genre: "Belgesel", modes: ["Atmosferik", "Doğa", "Tarih", "İlham Verici"] }
    ],
    "Besteler": [
        { genre: "Pop Slow", modes: ["Aşk", "Ayrılık", "Akustik"] },
        { genre: "Pop Hareketli", modes: ["Dans", "Yaz", "Parti"] },
        { genre: "Arabesk Slow", modes: ["Damar", "Acı", "Dertli"] },
        { genre: "Arabesk Hareketli", modes: ["Oyun Havası", "Düğün"] },
        { genre: "Trap Slow", modes: ["Deep", "Melankolik"] },
        { genre: "Trap Hareketli", modes: ["Banger", "Agresif"] }
    ]
};

export default function AdminPage() {
    // State Management
    const [formData, setFormData] = useState({
        title: "",
        category: "",
        genre: "",
        bpm: "",
        mode: ""
    });

    const [availableGenres, setAvailableGenres] = useState<{ genre: string, modes: string[] }[]>([]);
    const [availableModes, setAvailableModes] = useState<string[]>([]);

    // Handlers
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const category = e.target.value;
        // Update genres based on selected category
        const genres = HIERARCHY[category] || [];

        setAvailableGenres(genres);
        setAvailableModes([]); // Reset modes

        setFormData(prev => ({
            ...prev,
            category: category,
            genre: "", // Reset selection
            mode: ""   // Reset selection
        }));
    };

    const handleGenreChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const genre = e.target.value;

        // Find selected genre object to get modes
        const genreObj = availableGenres.find(g => g.genre === genre);
        const modes = genreObj ? genreObj.modes : [];

        setAvailableModes(modes);

        setFormData(prev => ({
            ...prev,
            genre: genre,
            mode: "" // Reset mode
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePublish = () => {
        console.log("Eser Yayınlanıyor...", formData);
        // In a real app, this would trigger a toast
        alert(`Eser Verileri Konsola Yazıldı:\n${JSON.stringify(formData, null, 2)}`);
    };

    return (
        <div className="min-h-screen bg-[#0b1121] text-white font-sans flex antialiased">
            {/* Sidebar Navigation */}
            <aside className="w-64 bg-[#0f172a] border-r border-[#1e293b] flex-col hidden md:flex sticky top-0 h-screen">
                <div className="p-8">
                    <div className="flex items-center gap-3 text-[#ede066]">
                        <div className="w-8 h-8 rounded-full bg-[#ede066] flex items-center justify-center shadow-[0_0_15px_rgba(237,224,102,0.4)]">
                            <svg className="w-5 h-5 text-[#0b1121]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 7l10 5 10-5-10-5zm0 9l2.5-1.25L12 8.5l-2.5 1.25L12 11zm0 2.5l-5-2.5-5 2.5L12 22l10-8.5-5-2.5-5 2.5z" /></svg>
                        </div>
                        <span className="font-bold text-lg tracking-wide">MBA AUDIO</span>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-2 mt-4">
                    <a href="#" className="flex items-center gap-3 px-4 py-3 bg-[#ede066]/10 text-[#ede066] rounded-xl transition-all border border-[#ede066]/20">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
                        <span className="font-medium">Dashboard</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1e293b] rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                        <span className="font-medium">Kütüphane</span>
                    </a>
                    <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-[#1e293b] rounded-xl transition-all">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                        <span className="font-medium">Ayarlar</span>
                    </a>
                </nav>

                <div className="p-6 border-t border-[#1e293b]">
                    <div className="flex items-center gap-3 p-3 bg-[#0b1121]/50 rounded-xl border border-[#2A3B55]">
                        <div className="w-10 h-10 rounded-full bg-[#1e293b] flex items-center justify-center text-[#ede066] font-bold border border-[#2A3B55]">A</div>
                        <div>
                            <h4 className="text-sm font-semibold text-white">Admin User</h4>
                            <p className="text-xs text-gray-500">Super Admin</p>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
                <div className="max-w-6xl mx-auto space-y-10">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Yeni Eser Yükle</h1>
                            <p className="text-slate-400 mt-1">Kütüphaneye yeni ses dosyaları ve meta veriler ekleyin.</p>
                        </div>
                        <div className="flex gap-3">
                            <button className="px-5 py-2.5 rounded-xl bg-[#1e293b] hover:bg-[#2A3B55] text-slate-300 font-medium transition-colors border border-[#2A3B55]">
                                Taslağı Kaydet
                            </button>
                            <button
                                onClick={handlePublish}
                                className="px-6 py-2.5 rounded-xl bg-[#ede066] hover:bg-[#d4c95b] text-[#0b1121] font-bold shadow-[0_4px_20px_rgba(237,224,102,0.2)] hover:shadow-[0_4px_30px_rgba(237,224,102,0.4)] transition-all flex items-center gap-2 transform active:scale-95">
                                <span>Eseri Yayınla</span>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

                        {/* Left Col: Metadata */}
                        <div className="xl:col-span-1 space-y-6">
                            {/* Card */}
                            <div className="bg-[#151e32] rounded-3xl p-6 md:p-8 border border-[#1e293b] shadow-xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-10 h-10 rounded-xl bg-[#0b1121] flex items-center justify-center text-[#ede066] border border-[#2A3B55]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    </div>
                                    <h2 className="text-xl font-bold text-white">Eser Bilgileri</h2>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Eser Adı</label>
                                        <input
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            type="text"
                                            placeholder="Örn: Midnight City"
                                            className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Kategori</label>
                                        <div className="relative">
                                            <select
                                                name="category"
                                                value={formData.category}
                                                onChange={handleCategoryChange}
                                                className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 cursor-pointer">
                                                <option value="">Seçiniz</option>
                                                {Object.keys(HIERARCHY).map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))}
                                            </select>
                                            <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Tür</label>
                                            <div className="relative">
                                                <select
                                                    name="genre"
                                                    value={formData.genre}
                                                    onChange={handleGenreChange}
                                                    disabled={!formData.category}
                                                    className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                                    <option value="">Seçiniz</option>
                                                    {availableGenres.map(g => (
                                                        <option key={g.genre} value={g.genre}>{g.genre}</option>
                                                    ))}
                                                </select>
                                                <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">BPM</label>
                                            <input
                                                name="bpm"
                                                value={formData.bpm}
                                                onChange={handleChange}
                                                type="number"
                                                placeholder="120"
                                                className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white placeholder-slate-600 focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs uppercase font-bold text-slate-500 tracking-wider">Mod (Opsiyonel)</label>
                                        <div className="relative">
                                            <select
                                                name="mode"
                                                value={formData.mode}
                                                onChange={handleChange}
                                                disabled={!formData.genre}
                                                className="w-full bg-[#0b1121] border border-[#2A3B55] rounded-xl px-4 py-3.5 text-white appearance-none focus:outline-none focus:border-[#ede066]/50 focus:ring-1 focus:ring-[#ede066]/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                                <option value="">Seçiniz...</option>
                                                {availableModes.map(m => (
                                                    <option key={m} value={m}>{m}</option>
                                                ))}
                                            </select>
                                            <svg className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Col: Media */}
                        <div className="xl:col-span-2 space-y-6">
                            {/* Card */}
                            <div className="bg-[#151e32] rounded-3xl p-6 md:p-8 border border-[#1e293b] shadow-xl h-full flex flex-col">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 rounded-xl bg-[#0b1121] flex items-center justify-center text-[#ede066] border border-[#2A3B55]">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Medya Dosyaları</h2>
                                        <p className="text-sm text-slate-400">Yüksek kaliteli ses dosyalarını buraya yükleyin.</p>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6 flex-1">
                                    {/* Box 1 */}
                                    <div className="border-2 border-dashed border-[#2A3B55] bg-[#0b1121]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#ede066] hover:bg-[#0b1121] transition-all cursor-pointer group relative overflow-hidden">
                                        <div className="w-14 h-14 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 group-hover:text-[#ede066] group-hover:scale-110 transition-all mb-4 z-10 border border-[#2A3B55]">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                        </div>
                                        <h3 className="font-semibold text-white z-10">Filigranlı Ön İzleme</h3>
                                        <p className="text-xs text-slate-500 mt-2 z-10 max-w-[200px]">Site üzerinde çalınacak demoyu yükleyin (MP3).</p>
                                    </div>

                                    {/* Box 2 */}
                                    <div className="border-2 border-dashed border-[#2A3B55] bg-[#0b1121]/50 rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-[#ede066] hover:bg-[#0b1121] transition-all cursor-pointer group relative overflow-hidden">
                                        <div className="w-14 h-14 rounded-full bg-[#1e293b] flex items-center justify-center text-slate-300 group-hover:text-[#ede066] group-hover:scale-110 transition-all mb-4 z-10 border border-[#2A3B55]">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <h3 className="font-semibold text-white z-10">Master Dosya (Main)</h3>
                                        <p className="text-xs text-slate-500 mt-2 z-10 max-w-[200px]">Müşteriye iletilecek orijinal WAV/MP3 dosya.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-[#151e32] rounded-3xl border border-[#1e293b] overflow-hidden shadow-xl">
                        <div className="p-6 border-b border-[#1e293b] flex justify-between items-center">
                            <h3 className="font-bold text-white text-lg">Son Eklenen Eserler</h3>
                            <button className="text-xs font-semibold text-[#ede066] hover:text-white transition-colors">TÜMÜNÜ GÖR</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="bg-[#0b1121] text-xs uppercase font-bold text-slate-500">
                                    <tr>
                                        <th className="px-6 py-4">Eser Adı</th>
                                        <th className="px-6 py-4">Kategori</th>
                                        <th className="px-6 py-4">Tür</th>
                                        <th className="px-6 py-4 text-center">BPM</th>
                                        <th className="px-6 py-4 text-right">Tarih</th>
                                        <th className="px-6 py-4 text-center">Durum</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#1e293b]">
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <p className="text-slate-500">Henüz yayınlanmış bir eser bulunamadı.</p>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
