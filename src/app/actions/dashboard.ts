'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';

import { env } from '@/lib/env';

export async function getDashboardStats() {
    // Env validation is handled in lib/env.ts, but we can double check if needed.
    // Since we are using supabaseAdmin which uses env internally, we are good.

    try {
        // Run all independent queries in parallel
        const [
            totalJobsResult,
            completedJobsResult,
            pendingJobsResult,
            inventoryResult,
            recentJobsResult,
            allJobsResult
        ] = await Promise.all([
            // 1. Total Jobs
            supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }),

            // 2. Completed Jobs
            supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).eq('status', 'completed'),

            // 3. Pending/Active Jobs
            supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }).in('status', ['pending', 'planned', 'in_progress']),

            // 4. Inventory (for Critical Stock)
            supabaseAdmin.from('inventory_items').select('current_stock, critical_stock_level'),

            // 5. Recent Activities
            supabaseAdmin.from('jobs')
                .select('id, title, status, created_at, profiles(first_name, last_name)')
                .order('created_at', { ascending: false })
                .limit(5),

            // 6. Job Status Distribution (Pie Chart)
            supabaseAdmin.from('jobs').select('status')
        ]);

        // Process Inventory
        const inventory = inventoryResult.data;
        const criticalStockCount = inventory?.filter(item => item.current_stock <= item.critical_stock_level).length || 0;

        // Process Pie Chart Data
        const jobs = allJobsResult.data;
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
                totalJobs: totalJobsResult.count || 0,
                completedJobs: completedJobsResult.count || 0,
                pendingJobs: pendingJobsResult.count || 0,
                criticalStockCount
            },
            recentJobs: recentJobsResult.data || [],
            pieChartData
        };

    } catch (error: any) {
        console.error('Dashboard Stats Error:', error);
        return { success: false, error: error.message };
    }
}
