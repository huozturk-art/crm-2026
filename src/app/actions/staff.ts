'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function createStaffUser(formData: FormData) {
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const phone = formData.get('phone') as string;
    const role = formData.get('role') as string;

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY eksik. Lütfen .env.local dosyasına ekleyin.' };
    }

    try {
        // 1. Create Auth User
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true, // Auto confirm
            user_metadata: {
                first_name: firstName,
                last_name: lastName
            }
        });

        if (authError) throw authError;
        if (!authData.user) throw new Error('Kullanıcı oluşturulamadı.');

        // 2. Update Profile (Trigger might have created it, but we want to be sure about role and phone)
        // Wait a bit for trigger? Or just upsert.
        // Since we have a trigger, the profile might already exist. Let's update it.

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                role: role as 'admin' | 'staff',
                is_active: true
            })
            .eq('id', authData.user.id);

        if (profileError) {
            // If update fails, maybe trigger hasn't run yet or failed. Let's try insert if not exists.
            const { error: insertError } = await supabaseAdmin
                .from('profiles')
                .upsert({
                    id: authData.user.id,
                    first_name: firstName,
                    last_name: lastName,
                    phone: phone,
                    role: role as 'admin' | 'staff',
                    is_active: true
                });

            if (insertError) throw insertError;
        }

        revalidatePath('/staff');
        return { success: true };
    } catch (error: any) {
        console.error('Create Staff Error:', error);
        return { success: false, error: error.message };
    }
}
