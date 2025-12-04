'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function NewInventoryItemPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        sku: '',
        unit: 'adet',
        unit_price: '',
        current_stock: '0',
        critical_stock_level: '5',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { error } = await supabase
                .from('inventory_items')
                .insert({
                    name: formData.name,
                    sku: formData.sku || null,
                    unit: formData.unit,
                    unit_price: formData.unit_price ? parseFloat(formData.unit_price) : null,
                    current_stock: parseFloat(formData.current_stock),
                    critical_stock_level: parseFloat(formData.critical_stock_level),
                });

            if (error) throw error;

            router.push('/inventory');
            router.refresh();
        } catch (err: any) {
            console.error('Error creating item:', err);
            setError(err.message || 'Malzeme oluşturulurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/inventory">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Geri
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Yeni Malzeme Ekle</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Malzeme Bilgileri</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Malzeme Adı *</label>
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    placeholder="Örn: 3x2.5 NYM Kablo"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Stok Kodu (SKU)</label>
                                <Input
                                    name="sku"
                                    value={formData.sku}
                                    onChange={handleChange}
                                    placeholder="Örn: KAB-001"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Birim *</label>
                                <select
                                    name="unit"
                                    value={formData.unit}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="adet">Adet</option>
                                    <option value="metre">Metre</option>
                                    <option value="kg">Kg</option>
                                    <option value="kutu">Kutu</option>
                                    <option value="paket">Paket</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mevcut Stok</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    name="current_stock"
                                    value={formData.current_stock}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Kritik Stok Seviyesi</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    name="critical_stock_level"
                                    value={formData.critical_stock_level}
                                    onChange={handleChange}
                                />
                                <p className="text-xs text-gray-500 mt-1">Stok bu seviyenin altına düştüğünde uyarı verilir.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Birim Fiyat (Opsiyonel)</label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    name="unit_price"
                                    value={formData.unit_price}
                                    onChange={handleChange}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={loading}>
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Kaydediliyor...' : 'Kaydet'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
