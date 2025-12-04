import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder';

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('⚠️ Supabase Admin keys are missing. Using placeholders to prevent build crash.');
}

// Note: This client should only be used in server-side contexts (API routes, Server Actions)
// never expose this to the client!
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
