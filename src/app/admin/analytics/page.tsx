"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { useTranslations, useLocale } from 'next-intl';
import { formatPrice } from '@/utils/format';
import {
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';

export default function AnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEarnings: 0,
        totalSales: 0,
        popularCategory: '-',
        activeDrafts: 0
    });
    const [recentSales, setRecentSales] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);
    const [currency, setCurrency] = useState('TL');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [customerHistory, setCustomerHistory] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const t = useTranslations('Analytics');
    const tc = useTranslations('Common');
    const locale = useLocale();

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            const [
                { data: settings },
                { data: orders },
                { count: draftCount }
            ] = await Promise.all([
                supabase.from('settings').select('currency').eq('id', 1).single(),
                supabase
                    .from('orders')
                    .select(`
                        id, 
                        amount, 
                        created_at, 
                        user_id,
                        tracks (
                            id,
                            title,
                            category_id,
                            categories ( name, name_en )
                        ),
                        profiles (
                            id,
                            email,
                            full_name,
                            avatar_url,
                            created_at
                        )
                    `),
                supabase
                    .from('tracks')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'draft')
            ]);

            if (settings) setCurrency(settings.currency);

            if (orders) {
                const totalEarnings = orders.reduce((acc, curr) => acc + Number(curr.amount), 0);
                const totalSales = orders.length;

                const catMap: any = {};
                orders.forEach((o: any) => {
                    const catName = locale === 'en' ? (o.tracks?.categories?.name_en || o.tracks?.categories?.name) : o.tracks?.categories?.name || 'Unknown';
                    catMap[catName] = (catMap[catName] || 0) + 1;
                });
                const popularCategory = Object.entries(catMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '-';

                setStats({ totalEarnings, totalSales, popularCategory, activeDrafts: draftCount || 0 });
                setRecentSales(orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));

                const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    return {
                        date: d.toLocaleDateString('tr-TR', { weekday: 'short' }),
                        fullDate: d.toISOString().split('T')[0],
                        sales: 0
                    };
                });
                orders.forEach(o => {
                    const oDate = new Date(o.created_at).toISOString().split('T')[0];
                    const day = last7Days.find(d => d.fullDate === oDate);
                    if (day) day.sales += Number(o.amount);
                });
                setChartData(last7Days);
            }
        } catch (err) {
            console.error('Analytics Error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleViewOrder = async (order: any) => {
        setSelectedOrder(order);
        setIsModalOpen(true);
        if (order.user_id) {
            const { data: userOrders } = await supabase
                .from('orders')
                .select('id, amount, created_at, tracks(title, categories(name))')
                .eq('user_id', order.user_id)
                .order('created_at', { ascending: false });
            setCustomerHistory(userOrders || []);
        }
    };

    // Derived user stats for modal
    const totalUserSpend = customerHistory.reduce((acc, cur) => acc + Number(cur.amount), 0);
    const avgOrderValue = customerHistory.length > 0 ? totalUserSpend / customerHistory.length : 0;

    // Multi-lang safe status badges
    const getUserStatusKey = () => {
        if (totalUserSpend > 3000) return 'statusVIP';
        if (totalUserSpend > 1000) return 'statusRegular';
        return 'statusNew';
    };

    if (loading) return <SkeletonLoader />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-black text-admin-text tracking-tight uppercase leading-none">{t('title')}</h1>
                    <p className="text-admin-text-muted mt-2 font-medium">{t('description')}</p>
                </div>
                <div className="px-5 py-3 bg-admin-card border border-admin-border rounded-2xl flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-xs font-black uppercase tracking-widest text-admin-text">{t('liveSync')}</span>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t('stats.totalEarnings'), value: formatPrice(stats.totalEarnings, currency), icon: '💰', color: 'text-green-400', bg: 'bg-green-500/5' },
                    { label: t('stats.totalSales'), value: stats.totalSales, icon: '📈', color: 'text-admin-primary', bg: 'bg-admin-primary/5' },
                    { label: t('stats.popularCategory'), value: stats.popularCategory, icon: '🔥', color: 'text-orange-400', bg: 'bg-orange-500/5' },
                    { label: t('stats.activeDrafts'), value: stats.activeDrafts, icon: '📝', color: 'text-blue-400', bg: 'bg-blue-500/5' }
                ].map((stat, i) => (
                    <div key={i} className={`bg-admin-card border border-admin-border p-7 rounded-[32px] shadow-xl hover:shadow-2xl hover:border-admin-primary/30 transition-all group relative overflow-hidden`}>
                        <div className={`absolute top-0 right-0 p-8 ${stat.bg} rounded-bl-[64px] opacity-20 group-hover:scale-110 transition-transform`}></div>
                        <h3 className="text-admin-text-muted text-[11px] font-black uppercase tracking-[0.2em] mb-2">{stat.label}</h3>
                        <p className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                        <div className="mt-4 flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-admin-text-muted/30"></div>
                            <span className="text-[10px] text-admin-text-muted font-bold uppercase tracking-widest">LIVE DATA FEED</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-admin-card border border-admin-border rounded-[40px] p-8 md:p-10 shadow-xl">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-admin-text uppercase">{t('salesChart')}</h3>
                            <p className="text-sm text-admin-text-muted font-medium mt-1">{t('performanceTitle')}</p>
                        </div>
                        <div className="px-4 py-2 bg-admin-bg border border-admin-border rounded-xl font-black text-xs text-admin-primary uppercase tracking-widest">{currency}</div>
                    </div>
                    <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ede066" stopOpacity={0.4} />
                                        <stop offset="95%" stopColor="#ede066" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }} dy={20} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 700 }} />
                                <Tooltip
                                    cursor={{ stroke: 'rgba(237, 224, 102, 0.1)', strokeWidth: 20 }}
                                    contentStyle={{ backgroundColor: '#151e32', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '24px', padding: '18px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
                                    itemStyle={{ color: '#ede066', fontWeight: 900 }}
                                />
                                <Area type="monotone" dataKey="sales" stroke="#ede066" strokeWidth={5} fillOpacity={1} fill="url(#colorSales)" animationDuration={1000} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Status Column */}
                <div className="bg-admin-card border border-admin-border rounded-[40px] p-8 md:p-10 shadow-xl flex flex-col justify-between">
                    <div>
                        <h3 className="text-2xl font-black text-admin-text mb-8 uppercase">{t('systemSummary')}</h3>
                        <div className="space-y-5">
                            <div className="p-7 bg-admin-bg/40 rounded-[30px] border border-admin-border hover:border-admin-primary/40 transition-all cursor-default group">
                                <p className="text-[10px] text-admin-text-muted font-black uppercase tracking-[0.2em] mb-3">{t('popularity')}</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-xl font-black text-admin-primary group-hover:scale-105 transition-transform">{stats.popularCategory}</p>
                                    <div className="w-10 h-10 bg-admin-primary/10 rounded-xl flex items-center justify-center text-admin-primary font-black">1.</div>
                                </div>
                            </div>
                            <div className="p-7 bg-admin-bg/40 rounded-[30px] border border-admin-border hover:border-admin-primary/40 transition-all cursor-default group">
                                <p className="text-[10px] text-admin-text-muted font-black uppercase tracking-[0.2em] mb-3">{t('volume')}</p>
                                <p className="text-2xl font-black text-white">{stats.totalSales} <span className="text-xs font-bold text-admin-text-muted ml-1 tracking-normal">{t('salesCount')}</span></p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-admin-border/50">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-admin-primary/10 flex items-center justify-center text-2xl shadow-inner">⚡</div>
                            <div>
                                <p className="text-sm font-black text-white uppercase tracking-tight">{t('performanceGood')}</p>
                                <p className="text-[10px] text-admin-text-muted font-bold uppercase tracking-tighter">{t('growthRate')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-admin-card border border-admin-border rounded-[48px] overflow-hidden shadow-2xl">
                <div className="p-10 md:p-12 border-b border-admin-border flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-admin-bg flex items-center justify-center text-admin-primary border border-admin-border shadow-xl">
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-admin-text tracking-tight uppercase">{t('recentSales')}</h3>
                            <p className="text-[10px] font-black text-admin-text-muted uppercase tracking-[0.2em] mt-1">{t('lastActivity')}</p>
                        </div>
                    </div>
                    <div className="px-5 py-2.5 bg-admin-bg border border-admin-border rounded-2xl font-black text-[10px] text-admin-text-muted uppercase tracking-[0.2em]">
                        {t('totalEntries', { count: recentSales.length })}
                    </div>
                </div>
                <div className="overflow-x-auto custom-scrollbar">
                    {recentSales.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-admin-bg/30 text-admin-text-muted text-[11px] uppercase font-black tracking-[0.25em] border-b border-admin-border">
                                <tr>
                                    <th className="px-12 py-7">{t('table.user')}</th>
                                    <th className="px-12 py-7">{t('table.track')}</th>
                                    <th className="px-12 py-7">{t('table.category')}</th>
                                    <th className="px-12 py-7">{t('table.price')}</th>
                                    <th className="px-12 py-7">{t('table.date')}</th>
                                    <th className="px-12 py-7 text-right">#</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin-border">
                                {recentSales.slice(0, 10).map((order, i) => (
                                    <tr key={i} className="hover:bg-admin-primary/[0.03] transition-colors group/row">
                                        <td className="px-12 py-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-12 h-12 rounded-[18px] bg-admin-border flex items-center justify-center overflow-hidden border border-admin-border shadow-sm group-hover/row:scale-105 transition-transform">
                                                    {order.profiles?.avatar_url ? (
                                                        <img src={order.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        <span className="text-sm font-black text-admin-text-muted">{(order.profiles?.full_name || 'A')[0]}</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="font-black text-admin-text group-hover/row:text-admin-primary transition-colors uppercase tracking-tight">{order.profiles?.full_name || t('anonymous')}</div>
                                                    <div className="text-[11px] text-admin-text-muted font-bold lowercase opacity-50 tracking-normal leading-none mt-1">{order.profiles?.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-12 py-8 font-black text-admin-text text-sm uppercase leading-tight max-w-[200px] truncate">{order.tracks?.title}</td>
                                        <td className="px-12 py-8">
                                            <span className="px-4 py-2 bg-admin-bg border border-admin-border rounded-xl text-[10px] font-black uppercase tracking-widest text-admin-text-muted shadow-sm group-hover/row:border-admin-primary/30 group-hover/row:text-admin-text transition-all">
                                                {locale === 'en' ? (order.tracks?.categories?.name_en || order.tracks?.categories?.name) : order.tracks?.categories?.name}
                                            </span>
                                        </td>
                                        <td className="px-12 py-8 font-black text-admin-primary text-lg tabular-nums">{formatPrice(order.amount, currency)}</td>
                                        <td className="px-12 py-8 text-admin-text-muted text-[11px] font-bold uppercase tracking-tighter opacity-70">{new Date(order.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                        <td className="px-12 py-8 text-right">
                                            <button
                                                onClick={() => handleViewOrder(order)}
                                                className="w-11 h-11 bg-admin-bg border border-admin-border rounded-[16px] flex items-center justify-center text-admin-text-muted hover:bg-admin-primary hover:text-admin-bg hover:border-admin-primary transition-all active:scale-90 group/btn shadow-sm">
                                                <svg className="w-5 h-5 group-hover/btn:scale-125 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7" /></svg>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-32 text-center">
                            <div className="w-24 h-24 bg-admin-bg rounded-full flex items-center justify-center mx-auto mb-8 border border-admin-border shadow-inner">
                                <svg className="w-12 h-12 text-admin-text-muted opacity-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                            </div>
                            <p className="text-admin-text-muted font-black uppercase tracking-[0.3em] text-xs">{t('noSales')}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* MODERN USER DETAIL MODAL */}
            {isModalOpen && selectedOrder && (
                <div className="fixed inset-0 bg-black/85 backdrop-blur-2xl z-[200] flex items-center justify-center p-4 animate-in fade-in duration-500">
                    <div className="bg-admin-card border border-white/5 rounded-[60px] w-full max-w-5xl max-h-[92vh] shadow-[0_0_120px_-30px_rgba(237,224,102,0.2)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in duration-400">
                        {/* LEFT PANEL: Profile & Stats */}
                        <div className="w-full md:w-[420px] bg-admin-bg/40 border-r border-white/5 p-12 flex flex-col items-center text-center overflow-y-auto custom-scrollbar">
                            <div className="relative mb-10">
                                <div className="w-36 h-36 rounded-[48px] bg-admin-border p-1.5 shadow-2xl relative z-10 overflow-hidden transform group-hover:rotate-3 transition-transform">
                                    {selectedOrder.profiles?.avatar_url ? (
                                        <img src={selectedOrder.profiles.avatar_url} alt="" className="w-full h-full object-cover rounded-[42px]" />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-admin-primary via-orange-400 to-pink-500 flex items-center justify-center rounded-[42px]">
                                            <span className="text-5xl font-black text-admin-bg">{(selectedOrder.profiles?.full_name || 'A')[0]}</span>
                                        </div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-3 -right-3 px-5 py-1.5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] z-20 shadow-2xl border-4 border-admin-card ${getUserStatusKey() === 'statusVIP' ? 'bg-orange-500 text-white' : getUserStatusKey() === 'statusRegular' ? 'bg-admin-primary text-admin-bg' : 'bg-blue-500 text-white'
                                    }`}>
                                    {t(getUserStatusKey())}
                                </div>
                            </div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-1">{selectedOrder.profiles?.full_name || t('anonymous')}</h2>
                            <p className="text-sm text-admin-text-muted font-bold opacity-40 mb-12 tracking-wide uppercase">{selectedOrder.profiles?.email}</p>

                            <div className="w-full space-y-5">
                                <div className="p-7 bg-white/5 rounded-[36px] border border-white/5 flex flex-col items-center shadow-inner">
                                    <span className="text-[11px] font-black text-admin-text-muted uppercase tracking-[0.25em] mb-2">{t('totalSpend')}</span>
                                    <span className="text-4xl font-black text-admin-primary tracking-tighter">{formatPrice(totalUserSpend, currency)}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 transition-transform hover:scale-105">
                                        <span className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest block mb-2">{t('volume')}</span>
                                        <span className="text-2xl font-black text-white">{customerHistory.length}</span>
                                    </div>
                                    <div className="p-6 bg-white/5 rounded-[32px] border border-white/5 transition-transform hover:scale-105">
                                        <span className="text-[10px] font-black text-admin-text-muted uppercase tracking-widest block mb-2">{t('avgOrderValue')}</span>
                                        <span className="text-xl font-black text-white leading-none mt-1 block">{formatPrice(avgOrderValue, currency)}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-white/5 w-full">
                                <p className="text-[11px] font-black text-admin-text-muted uppercase tracking-[0.25em] mb-3">{t('memberSince')}</p>
                                <p className="text-base font-black text-white uppercase tracking-widest">{new Date(selectedOrder.profiles?.created_at).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>

                        {/* RIGHT PANEL: History & Details */}
                        <div className="flex-1 p-12 md:p-16 overflow-y-auto custom-scrollbar flex flex-col justify-between">
                            <div className="space-y-12">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-admin-primary">{t('orderDetails')}</h3>
                                    <button onClick={() => setIsModalOpen(false)} className="w-11 h-11 flex items-center justify-center bg-white/5 rounded-2xl text-admin-text-muted hover:text-white transition-colors border border-white/5">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg>
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <p className="text-[11px] font-black text-admin-text-muted uppercase tracking-[0.3em]">{t('purchasedTracks')}</p>
                                    <div className="space-y-5">
                                        {/* Current Item Highlight */}
                                        <div className="p-8 bg-admin-primary/10 border-4 border-admin-primary/40 rounded-[44px] relative overflow-hidden group shadow-2xl">
                                            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-125 transition-transform">
                                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5z" /></svg>
                                            </div>
                                            <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-end gap-6">
                                                <div>
                                                    <span className="text-[10px] font-black text-admin-primary uppercase tracking-[0.25em] block mb-3">{t('currentOrder')}</span>
                                                    <h4 className="text-2xl font-black text-white uppercase tracking-tight mb-2">{selectedOrder.tracks?.title}</h4>
                                                    <span className="px-3 py-1 bg-admin-primary/20 rounded-lg text-[10px] font-black text-admin-primary uppercase tracking-[0.2em]">
                                                        {locale === 'en' ? (selectedOrder.tracks?.categories?.name_en || selectedOrder.tracks?.categories?.name) : selectedOrder.tracks?.categories?.name}
                                                    </span>
                                                </div>
                                                <div className="text-left sm:text-right">
                                                    <div className="text-3xl font-black text-admin-primary mb-1 tracking-tighter">{formatPrice(selectedOrder.amount, currency)}</div>
                                                    <div className="text-[11px] font-bold text-admin-text-muted uppercase tracking-widest leading-none mt-2">{new Date(selectedOrder.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(selectedOrder.created_at).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* History Timeline */}
                                        <div className="space-y-4 pt-6">
                                            {customerHistory.filter(h => h.id !== selectedOrder.id).slice(0, 5).map((h, idx) => (
                                                <div key={h.id} className="flex gap-6 items-start group/item">
                                                    <div className="h-full flex flex-col items-center pt-2.5">
                                                        <div className="w-2.5 h-2.5 rounded-full bg-white/10 group-hover/item:bg-admin-primary transition-all group-hover/item:scale-150"></div>
                                                        {idx !== customerHistory.filter(h => h.id !== selectedOrder.id).slice(0, 5).length - 1 && (
                                                            <div className="w-[1px] h-14 bg-white/5 my-2"></div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pb-6 border-b border-white/[0.03]">
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <h5 className="text-sm font-black text-admin-text-muted uppercase group-hover/item:text-white transition-colors tracking-tight">{h.tracks?.title}</h5>
                                                                <span className="text-xs font-black text-admin-primary/50 uppercase tracking-[0.1em]">
                                                                    {locale === 'en' ? (h.tracks?.categories?.name_en || h.tracks?.categories?.name) : h.tracks?.categories?.name}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-sm font-black text-white">{formatPrice(h.amount, currency)}</div>
                                                                <div className="text-[10px] font-black text-admin-text-muted uppercase mt-1">{new Date(h.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {customerHistory.length <= 1 && (
                                                <div className="p-12 text-center bg-white/[0.02] rounded-[40px] border-2 border-dashed border-white/5">
                                                    <p className="text-[11px] font-black text-admin-text-muted uppercase tracking-[0.3em]">{t('noHistory')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 flex flex-col sm:flex-row gap-5">
                                <button
                                    onClick={() => window.open(`mailto:${selectedOrder.profiles?.email}`)}
                                    className="flex-1 py-6 bg-admin-primary border border-admin-primary rounded-[28px] font-black text-admin-bg uppercase tracking-[0.3em] text-[12px] hover:bg-admin-primary/90 hover:scale-[1.02] transition-all active:scale-95 shadow-2xl shadow-admin-primary/30">
                                    {t('manageProfileSendMsg')}
                                </button>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-12 py-6 bg-white/5 border border-white/10 rounded-[28px] font-black text-admin-text-muted uppercase tracking-[0.3em] text-[12px] hover:bg-white/10 hover:text-white transition-all active:scale-95">
                                    {tc('cancel')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
