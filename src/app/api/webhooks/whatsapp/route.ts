import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppMessage, getWhatsAppMediaUrl, downloadWhatsAppMedia } from '@/lib/whatsapp';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { analyzeImage } from '@/lib/gemini';

import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

// Webhook verification (GET)
export async function GET(req: NextRequest) {
    const searchParams = req.nextUrl.searchParams;
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');

    const verifyToken = env.WHATSAPP_VERIFY_TOKEN;

    console.log('Verification Request:', { mode, token, challenge, expectedToken: verifyToken });

    if (mode === 'subscribe' && token === verifyToken) {
        console.log('Verification Successful');
        return new NextResponse(challenge, { status: 200 });
    } else {
        console.log('Verification Failed: Token mismatch or invalid mode');
        return new NextResponse('Forbidden', { status: 403 });
    }
}

// Handle incoming messages (POST)
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        console.log('Webhook received:', JSON.stringify(body));

        // Check if it's a WhatsApp status update or message
        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const message = value?.messages?.[0];

        if (!message) {
            console.log('No message found in payload');
            return new NextResponse('OK', { status: 200 });
        }

        const from = message.from; // Sender phone number
        const messageType = message.type;
        console.log(`Processing message from: ${from}, type: ${messageType}`);

        // 1. Find staff by phone number
        // Note: WhatsApp numbers usually come as '905551234567'. Ensure DB matches or normalize.
        // For now, we assume exact match or contains.
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, first_name, last_name')
            .ilike('phone', `%${from.replace(/\D/g, '').slice(-10)}%`) // Match last 10 digits
            .single();

        if (!profile) {
            console.log('Unknown sender:', from);
            // Optional: Send "You are not registered" message
            return new NextResponse('OK', { status: 200 });
        }

        console.log(`Sender identified: ${profile.first_name} ${profile.last_name}`);

        if (messageType === 'image') {
            await handleImageMessage(message, profile, from);
        } else if (messageType === 'text') {
            await handleTextMessage(message, profile, from);
        }

        return new NextResponse('OK', { status: 200 });
    } catch (error) {
        console.error('Webhook error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}

async function handleImageMessage(message: any, profile: any, from: string) {
    const imageId = message.image.id;

    // 1. Get Image URL and Download
    const mediaUrl = await getWhatsAppMediaUrl(imageId);
    if (!mediaUrl) return;

    const imageBuffer = await downloadWhatsAppMedia(mediaUrl);
    if (!imageBuffer) return;

    // 2. Upload to Supabase Storage
    const fileName = `whatsapp/${profile.id}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabaseAdmin.storage
        .from('crm-media')
        .upload(fileName, imageBuffer, {
            contentType: 'image/jpeg'
        });

    if (uploadError) {
        console.error('Upload error:', uploadError);
        await sendWhatsAppMessage(from, 'Fotoğraf yüklenirken hata oluştu.');
        return;
    }

    const publicUrl = `${env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/crm-media/${fileName}`;

    // 3. Analyze with Gemini
    // Convert buffer to base64 for Gemini
    const base64Image = Buffer.from(imageBuffer).toString('base64');
    const analysis = await analyzeImage(base64Image, 'image/jpeg');

    // 4. Find Active Job for Staff
    // We assume the staff has one active job or we pick the latest 'in_progress'
    const { data: activeJob } = await supabaseAdmin
        .from('jobs')
        .select('id, title')
        .eq('assigned_to', profile.id)
        .eq('status', 'in_progress')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (activeJob) {
        // Create Report
        await supabaseAdmin.from('job_reports').insert({
            job_id: activeJob.id,
            staff_id: profile.id,
            report_type: 'daily', // Or infer from time?
            description: `[WhatsApp Otomatik Rapor]\nAI Analizi: ${analysis}`,
            media_urls: [publicUrl],
            created_at: new Date().toISOString()
        });

        await sendWhatsAppMessage(from, `✅ Fotoğraf alındı ve "${activeJob.title}" işine rapor olarak eklendi.\n\nAI Analizi: ${analysis}`);
    } else {
        await sendWhatsAppMessage(from, `⚠️ Aktif bir işiniz bulunamadı. Fotoğraf kaydedildi ancak bir işe bağlanamadı.\n\nAI Analizi: ${analysis}`);
    }
}

async function handleTextMessage(message: any, profile: any, from: string) {
    const text = message.text.body.toLowerCase();

    if (text.includes('durum') || text.includes('görev')) {
        // Fetch tasks
        const { data: jobs } = await supabaseAdmin
            .from('jobs')
            .select('title, status, planned_start_date')
            .eq('assigned_to', profile.id)
            .in('status', ['planned', 'in_progress']);

        if (jobs && jobs.length > 0) {
            const jobList = jobs.map(j => `- ${j.title} (${j.status === 'in_progress' ? 'Devam Ediyor' : 'Planlandı'})`).join('\n');
            await sendWhatsAppMessage(from, `📋 Mevcut Görevleriniz:\n${jobList}`);
        } else {
            await sendWhatsAppMessage(from, 'Şu an üzerinizde aktif bir görev görünmüyor.');
        }
    } else {
        await sendWhatsAppMessage(from, `Merhaba ${profile.first_name}, fotoğraf göndererek rapor oluşturabilir veya "durum" yazarak görevlerinizi öğrenebilirsiniz.`);
    }
}
