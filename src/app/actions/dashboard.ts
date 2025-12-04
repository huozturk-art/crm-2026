'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function getDashboardStats() {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY eksik.' };
    }

    try {
        // 1. Job Stats
        const { count: totalJobs } = await supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true });

        const { count: completedJobs } = await supabaseAdmin
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'completed');

        const { count: pendingJobs } = await supabaseAdmin
            .from('jobs')
            .select('*', { count: 'exact', head: true })
            .in('status', ['pending', 'planned', 'in_progress']);

        // 2. Inventory Stats (Critical Stock)
        // We need to fetch items where current_stock <= critical_stock_level
        // Supabase doesn't support field comparison in filter easily without RPC, so we fetch and filter or use a view.
        // For small dataset, fetching all is fine. For large, use RPC.
        // Let's try to use a simple query first.
        const { data: inventory } = await supabaseAdmin
            .from('inventory_items')
            .select('current_stock, critical_stock_level');

        const criticalStockCount = inventory?.filter(item => item.current_stock <= item.critical_stock_level).length || 0;

        // 3. Recent Activities (Last 5 Jobs)
        const { data: recentJobs } = await supabaseAdmin
            .from('jobs')
            .select('id, title, status, created_at, profiles(first_name, last_name)')
            .order('created_at', { ascending: false })
            .limit(5);

        // 4. Job Status Distribution (for Pie Chart)
        const { data: jobs } = await supabaseAdmin.from('jobs').select('status');
        const statusDist = jobs?.reduce((acc: any, job) => {
            acc[job.status] = (acc[job.status] || 0) + 1;
            return acc;
        }, {});

        const pieChartData = [
            { name: 'Bekleyen', value: statusDist?.pending || 0, color: '#F59E0B' }, // Amber
            { name: 'Planlandı', value: statusDist?.planned || 0, color: '#3B82F6' }, // Blue
            { name: 'Devam Ediyor', value: statusDist?.in_progress || 0, color: '#8B5CF6' }, // Violet
            { name: 'Tamamlandı', value: statusDist?.completed || 0, color: '#10B981' }, // Green
            { name: 'İptal', value: statusDist?.cancelled || 0, color: '#EF4444' }, // Red
        ].filter(item => item.value > 0);

        return {
            success: true,
            stats: {
                totalJobs: totalJobs || 0,
                completedJobs: completedJobs || 0,
                pendingJobs: pendingJobs || 0,
                criticalStockCount
            },
            recentJobs: recentJobs || [],
            pieChartData
        };

    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return { success: false, error: error.message };
    }
}
