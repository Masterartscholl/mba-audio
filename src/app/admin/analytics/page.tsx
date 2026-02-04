"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { SkeletonLoader } from '@/components/admin/SkeletonLoader';
import { useTranslations } from 'next-intl';
import { formatPrice } from '@/utils/format';
import {
    LineChart,
    Line,
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
    const t = useTranslations('Analytics');

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            setLoading(true);

            // 1. Fetch Settings for Currency
            const { data: settings } = await supabase.from('settings').select('currency').eq('id', 1).single();
            if (settings) setCurrency(settings.currency);

            // 2. Fetch Stats
            const { data: orders, error: ordersErr } = await supabase
                .from('orders')
                .select('amount, created_at, tracks(category_id, categories(name)), profiles(email, full_name)');

            const { count: draftCount } = await supabase
                .from('tracks')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'draft');

            if (orders) {
                const totalEarnings = orders.reduce((acc, curr) => acc + Number(curr.amount), 0);
                const totalSales = orders.length;

                // Popular Category
                const catMap: any = {};
                orders.forEach((o: any) => {
                    const catName = o.tracks?.categories?.name || 'Unknown';
                    catMap[catName] = (catMap[catName] || 0) + 1;
                });
                const popularCategory = Object.entries(catMap).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '-';

                setStats({
                    totalEarnings,
                    totalSales,
                    popularCategory,
                    activeDrafts: draftCount || 0
                });

                // Recent Sales
                setRecentSales(orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5));

                // Chart Data (Last 7 Days)
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

    if (loading) return <SkeletonLoader />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-admin-text tracking-tight">{t('title')}</h1>
                <p className="text-admin-text-muted mt-1">{t('description')}</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: t('stats.totalEarnings'), value: formatPrice(stats.totalEarnings, currency), icon: '💰', color: 'text-green-500' },
                    { label: t('stats.totalSales'), value: stats.totalSales, icon: '📈', color: 'text-admin-primary' },
                    { label: t('stats.popularCategory'), value: stats.popularCategory, icon: '🔥', color: 'text-orange-500' },
                    { label: t('stats.activeDrafts'), value: stats.activeDrafts, icon: '📝', color: 'text-blue-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-admin-card border border-admin-border p-6 rounded-3xl shadow-xl hover:scale-[1.02] transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-2xl">{stat.icon}</span>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-admin-text-muted">Live</span>
                        </div>
                        <h3 className="text-admin-text-muted text-xs font-bold uppercase mb-1">{stat.label}</h3>
                        <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Chart Section */}
                <div className="lg:col-span-2 bg-admin-card border border-admin-border rounded-[32px] p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-bold text-admin-text">{t('salesChart')}</h3>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-admin-primary"></div>
                                <span className="text-xs text-admin-text-muted font-medium">{currency}</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#ede066" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#ede066" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                                <XAxis
                                    dataKey="date"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 12 }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#151e32',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        borderRadius: '12px',
                                        color: '#fff'
                                    }}
                                    itemStyle={{ color: '#ede066' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="sales"
                                    stroke="#ede066"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorSales)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Popularity / Recent Activity */}
                <div className="bg-admin-card border border-admin-border rounded-[32px] p-8 shadow-xl">
                    <h3 className="text-xl font-bold text-admin-text mb-6">{t('systemSummary')}</h3>
                    <div className="space-y-6">
                        <div className="p-4 bg-admin-bg rounded-2xl border border-admin-border">
                            <p className="text-xs text-admin-text-muted font-bold uppercase mb-1">{t('dataFreshness')}</p>
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-sm font-medium text-admin-text">{t('liveSync')}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-admin-bg rounded-2xl border border-admin-border">
                            <p className="text-xs text-admin-text-muted font-bold uppercase mb-1">{t('popularity')}</p>
                            <p className="text-lg font-bold text-admin-primary">{stats.popularCategory}</p>
                            <p className="text-[10px] text-admin-text-muted mt-1">{t('categoryDensity')}</p>
                        </div>
                        <div className="p-4 bg-admin-bg rounded-2xl border border-admin-border">
                            <p className="text-xs text-admin-text-muted font-bold uppercase mb-1">{t('volume')}</p>
                            <p className="text-lg font-bold text-white">{stats.totalSales} <span className="text-xs font-normal text-admin-text-muted">{t('salesCount')}</span></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sales Table */}
            <div className="bg-admin-card border border-admin-border rounded-[32px] overflow-hidden shadow-xl">
                <div className="p-8 border-b border-admin-border flex items-center justify-between">
                    <h3 className="text-xl font-bold text-admin-text">{t('recentSales')}</h3>
                    <button className="text-xs font-bold text-admin-primary hover:underline">{t('viewAll')}</button>
                </div>
                <div className="overflow-x-auto">
                    {recentSales.length > 0 ? (
                        <table className="w-full text-left">
                            <thead className="bg-admin-bg text-admin-text-muted text-xs uppercase font-bold tracking-wider">
                                <tr>
                                    <th className="px-8 py-4">{t('table.user')}</th>
                                    <th className="px-8 py-4">{t('table.track')}</th>
                                    <th className="px-8 py-4">{t('table.category')}</th>
                                    <th className="px-8 py-4">{t('table.price')}</th>
                                    <th className="px-8 py-4">{t('table.date')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-admin-border">
                                {recentSales.map((order, i) => (
                                    <tr key={i} className="hover:bg-admin-bg/30 transition-colors">
                                        <td className="px-8 py-5">
                                            <div className="font-bold text-admin-text">{order.profiles?.full_name || t('anonymous')}</div>
                                            <div className="text-xs text-admin-text-muted">{order.profiles?.email}</div>
                                        </td>
                                        <td className="px-8 py-5 font-medium text-admin-text">{order.tracks?.title}</td>
                                        <td className="px-8 py-5">
                                            <span className="px-3 py-1 bg-admin-border/50 rounded-full text-[10px] font-bold text-admin-text-muted">
                                                {order.tracks?.categories?.name}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 font-bold text-admin-primary">{formatPrice(order.amount, currency)}</td>
                                        <td className="px-8 py-5 text-admin-text-muted text-sm">{new Date(order.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div className="p-20 text-center">
                            <div className="w-20 h-20 bg-admin-bg rounded-full flex items-center justify-center mx-auto mb-4 border border-admin-border">
                                <svg className="w-10 h-10 text-admin-text-muted opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                            </div>
                            <p className="text-admin-text-muted font-medium">{t('noSales')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
