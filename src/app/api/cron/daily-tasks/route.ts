import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// This route should be called by a Cron Job scheduler (e.g., Vercel Cron, GitHub Actions, or external service)
// Example Vercel Cron: "0 18 * * *" (Every day at 18:00)
import { env } from '@/lib/env';

// ...

export async function GET(req: Request) {
    // Basic security check (use a secret query param)
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    if (secret !== env.CRON_SECRET) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        // 1. Get all active staff with phone numbers
        const { data: staffList } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, phone')
            .eq('role', 'staff')
            .eq('is_active', true)
            .not('phone', 'is', null);

        if (!staffList) return new NextResponse('No staff found', { status: 200 });

        const results = [];

        // 2. For each staff, find tomorrow's tasks (or active tasks)
        for (const staff of staffList) {
            if (!staff.phone) continue;

            const { data: tasks } = await supabaseAdmin
                .from('jobs')
                .select('title, description, planned_start_date, status')
                .eq('assigned_to', staff.id)
                .in('status', ['planned', 'in_progress']);
            // .gte('planned_start_date', tomorrow...) // Optional: Filter by date

            if (tasks && tasks.length > 0) {
                const taskList = tasks.map(t =>
                    `🔹 *${t.title}*\n   Durum: ${t.status === 'in_progress' ? 'Devam Ediyor' : 'Planlandı'}\n   Tarih: ${new Date(t.planned_start_date).toLocaleDateString('tr-TR')}`
                ).join('\n\n');

                const message = `Merhaba ${staff.first_name}, yarınki/mevcut görevleriniz:\n\n${taskList}\n\nİyi çalışmalar! 👋`;

                // Send WhatsApp Message
                try {
                    await sendWhatsAppMessage(staff.phone, message);
                    results.push({ staff: staff.first_name, status: 'sent' });
                } catch (error) {
                    console.error(`Failed to send to ${staff.first_name}:`, error);
                    results.push({ staff: staff.first_name, status: 'failed' });
                }
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Cron job error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
