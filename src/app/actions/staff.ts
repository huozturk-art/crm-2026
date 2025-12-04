'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function createStaffUser(formData: FormData) {
    const firstName = formData.get('first_name') as string;
    const lastName = formData.get('last_name') as string;
    const phone = formData.get('phone') as string;
    const role = formData.get('role') as string;

    // Auto-generate email and password if not provided (for staff who don't login)
    // Format: phone@crm.local (e.g. 905551234567@crm.local)
    const cleanPhone = phone.replace(/\D/g, '');
    const email = formData.get('email') as string || `${cleanPhone}@crm.local`;
    const password = formData.get('password') as string || Math.random().toString(36).slice(-8) + 'Aa1!'; // Random strong password

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

        // 2. Update Profile
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

export async function updateStaffUser(profile: {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    role: 'admin' | 'staff';
    is_active: boolean;
}) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY eksik.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('profiles')
            .update({
                first_name: profile.first_name,
                last_name: profile.last_name,
                phone: profile.phone,
                role: profile.role,
                is_active: profile.is_active
            })
            .eq('id', profile.id);

        if (error) throw error;

        revalidatePath('/staff');
        return { success: true };
    } catch (error: any) {
        console.error('Update Staff Error:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteStaffUser(userId: string) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY eksik.' };
    }

    try {
        // 1. Clean up related data to avoid Foreign Key constraints
        // Unassign jobs
        await supabaseAdmin.from('jobs').update({ assigned_to: null }).eq('assigned_to', userId);

        // Delete reports created by user (or you could set created_by to null if allowed)
        await supabaseAdmin.from('job_reports').delete().eq('created_by', userId);

        // 2. Delete from Auth (This might cascade to profiles if configured)
        const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (authError) {
            console.log('Auth delete failed, trying manual profile delete first...', authError.message);
            // If auth delete fails, try deleting profile first
            const { error: profileError } = await supabaseAdmin.from('profiles').delete().eq('id', userId);
            if (profileError) throw profileError;

            // Try auth delete again
            const { error: retryError } = await supabaseAdmin.auth.admin.deleteUser(userId);
            if (retryError) throw retryError;
        }

        revalidatePath('/staff');
        return { success: true };
    } catch (error: any) {
        console.error('Delete Staff Error:', error);
        return { success: false, error: error.message };
    }
}
