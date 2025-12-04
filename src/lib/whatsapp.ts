import { env } from '@/lib/env';

const WHATSAPP_API_URL = 'https://graph.facebook.com/v17.0';

export async function sendWhatsAppMessage(to: string, text: string) {
    const token = env.WHATSAPP_API_TOKEN;
    const phoneId = env.WHATSAPP_PHONE_ID;

    if (!token || !phoneId) {
        console.warn('WhatsApp credentials missing. Message not sent:', text);
        return;
    }

    try {
        const response = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                messaging_product: 'whatsapp',
                to: to,
                type: 'text',
                text: { body: text },
            }),
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(JSON.stringify(data));
        }
        return data;
    } catch (error) {
        console.error('Error sending WhatsApp message:', error);
        throw error;
    }
}

export async function getWhatsAppMediaUrl(mediaId: string): Promise<string | null> {
    const token = env.WHATSAPP_API_TOKEN;

    if (!token) {
        console.error('WhatsApp token missing');
        return null;
    }

    try {
        const response = await fetch(`${WHATSAPP_API_URL}/${mediaId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        const data = await response.json();
        if (!response.ok) throw new Error(JSON.stringify(data));

        return data.url; // This is the URL to download the binary
    } catch (error) {
        console.error('Error getting media URL:', error);
        return null;
    }
}

export async function downloadWhatsAppMedia(url: string): Promise<ArrayBuffer | null> {
    const token = env.WHATSAPP_API_TOKEN;

    if (!token) return null;

    try {
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) throw new Error('Failed to download media');

        return await response.arrayBuffer();
    } catch (error) {
        console.error('Error downloading media:', error);
        return null;
    }
}
