import { z } from 'zod';

const envSchema = z.object({
    // Supabase - Public
    NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL geçerli bir URL olmalıdır."),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY eksik."),

    // Supabase - Private (Server-side only)
    // Note: These might be undefined on client-side, so we make them optional or check context
    // But for server-side code importing this, they should be present.
    // We'll treat them as optional here to avoid client-side build errors, 
    // but specific server-side modules should check them.
    SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

    // AI
    GEMINI_API_KEY: z.string().optional(),

    // WhatsApp
    WHATSAPP_API_TOKEN: z.string().optional(),
    WHATSAPP_PHONE_ID: z.string().optional(),
    WHATSAPP_VERIFY_TOKEN: z.string().optional(),

    // Security
    CRON_SECRET: z.string().optional(),
});

// Validate process.env
// We use safeParse to avoid crashing immediately if we want to handle errors gracefully,
// or parse to crash early.
const _env = envSchema.safeParse(process.env);

if (!_env.success) {
    console.error('❌ Geçersiz ortam değişkenleri:', _env.error.format());
    // In a real strict app, we might want to throw here.
    // throw new Error('Geçersiz ortam değişkenleri');
}

// Export the validated env or process.env as fallback (with types)
export const env = _env.success ? _env.data : process.env;
