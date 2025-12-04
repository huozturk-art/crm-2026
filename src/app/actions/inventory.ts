'use server';

import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { revalidatePath } from 'next/cache';

export async function createInventoryItem(formData: FormData) {
    const name = formData.get('name') as string;
    const stock = parseInt(formData.get('stock') as string);
    const unit = formData.get('unit') as string;
    const min_stock = parseInt(formData.get('min_stock') as string);

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY eksik.' };
    }

    try {
        const { error } = await supabaseAdmin
            .from('inventory')
            .insert({
                name,
                stock,
                unit,
                min_stock
            });

        if (error) throw error;

        revalidatePath('/inventory');
        return { success: true };
    } catch (error: any) {
        console.error('Create Inventory Error:', error);
        return { success: false, error: error.message };
    }
}

export async function bulkCreateInventory(items: any[]) {
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return { success: false, error: 'SUPABASE_SERVICE_ROLE_KEY eksik.' };
    }

    try {
        // Prepare data for insertion
        // Expected format from Excel: { "Ürün Adı": "Kablo", "Stok": 100, "Birim": "Metre", "Kritik Stok": 10 }
        // Map to DB columns: name, stock, unit, min_stock

        const validItems = items.map(item => ({
            name: item['Ürün Adı'] || item['name'] || 'İsimsiz Ürün',
            stock: parseInt(item['Stok'] || item['stock'] || '0'),
            unit: item['Birim'] || item['unit'] || 'Adet',
            min_stock: parseInt(item['Kritik Stok'] || item['min_stock'] || '0')
        })).filter(item => item.name !== 'İsimsiz Ürün');

        if (validItems.length === 0) {
            return { success: false, error: 'Yüklenecek geçerli veri bulunamadı.' };
        }

        const { error } = await supabaseAdmin
            .from('inventory_items')
            .insert(validItems);

        if (error) throw error;

        revalidatePath('/inventory');
        return { success: true, count: validItems.length };
    } catch (error: any) {
        console.error('Bulk Create Inventory Error:', error);
        return { success: false, error: error.message };
    }
}

export async function updateInventoryItem(id: string, data: any) {
    try {
        const { error } = await supabaseAdmin
            .from('inventory')
            .update(data)
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/inventory');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteInventoryItem(id: string) {
    try {
        const { error } = await supabaseAdmin
            .from('inventory')
            .delete()
            .eq('id', id);

        if (error) throw error;
        revalidatePath('/inventory');
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
