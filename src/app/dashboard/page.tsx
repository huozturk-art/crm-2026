'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Briefcase, AlertCircle, CheckCircle, Package, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';

function DashboardCard({ title, value, icon: Icon, color, loading }: any) {
    return (
        <Card className="shadow-sm border-gray-100">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    {loading ? (
                        <div className="h-8 w-16 bg-gray-200 animate-pulse rounded mt-1"></div>
                    ) : (
                        <h3 className="text-2xl font-bold text-gray-900 mt-1">{value}</h3>
                    )}
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="w-6 h-6 text-white" />
                </div>
            </CardContent>
        </Card>
    );
}

export default function DashboardPage() {
    const [stats, setStats] = useState({
        activeJobs: 0,
        completedJobs: 0,
        criticalStock: 0,
        totalStaff: 0
    });
    const [recentReports, setRecentReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            // 1. İstatistikler
            const { count: activeJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'in_progress');
            const { count: completedJobs } = await supabase.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed');
            const { count: totalStaff } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'staff').eq('is_active', true);

            // Kritik stok (client-side filter gerekebilir veya view)
            // Şimdilik basitçe tüm itemları çekip filtreleyelim (az veri varsayımı)
            const { data: inventory } = await supabase.from('inventory_items').select('current_stock, critical_stock_level');
            const criticalStock = inventory?.filter(i => i.current_stock <= i.critical_stock_level).length || 0;

            setStats({
                activeJobs: activeJobs || 0,
                completedJobs: completedJobs || 0,
                criticalStock,
                totalStaff: totalStaff || 0
            });

            // 2. Son Raporlar
            const { data: reports } = await supabase
                .from('job_reports')
                .select(`
                    id,
                    report_type,
                    created_at,
                    description,
                    jobs (title),
                    profiles (first_name, last_name)
                `)
                .order('created_at', { ascending: false })
                .limit(5);

            setRecentReports(reports || []);

        } catch (error) {
            console.error('Dashboard data fetch error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Genel Bakış</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Aktif İşler"
                    value={stats.activeJobs}
                    icon={Briefcase}
                    color="bg-blue-500"
                    loading={loading}
                />
                <DashboardCard
                    title="Tamamlanan İşler"
                    value={stats.completedJobs}
                    icon={CheckCircle}
                    color="bg-green-500"
                    loading={loading}
                />
                <DashboardCard
                    title="Kritik Stok"
                    value={stats.criticalStock}
                    icon={Package}
                    color="bg-red-500"
                    loading={loading}
                />
                <DashboardCard
                    title="Aktif Personel"
                    value={stats.totalStaff}
                    icon={Activity}
                    color="bg-purple-500"
                    loading={loading}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Son Raporlar</h3>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-4 text-gray-500">Yükleniyor...</div>
                        ) : recentReports.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">Henüz rapor yok.</div>
                        ) : (
                            recentReports.map((report) => (
                                <div key={report.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${report.report_type === 'start' ? 'bg-blue-400' : 'bg-green-400'
                                        }`}>
                                        {report.report_type === 'start' ? 'B' : 'S'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {report.profiles?.first_name} {report.profiles?.last_name} - {report.report_type === 'start' ? 'İşe Başlama' : 'İş Bitiş'}
                                        </p>
                                        <p className="text-xs text-gray-500">{report.jobs?.title}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true, locale: tr })}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Personel Performansı (Placeholder - İleride gerçek veri eklenebilir) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 opacity-50 pointer-events-none relative">
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-medium text-gray-500">Yakında</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personel Performansı</h3>
                    <div className="space-y-4 filter blur-sm">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold">XX</div>
                                    <span className="text-sm font-medium text-gray-700">Personel Adı</span>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500" style={{ width: '85%' }} />
                                    </div>
                                    <span className="text-sm text-gray-600">85%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
