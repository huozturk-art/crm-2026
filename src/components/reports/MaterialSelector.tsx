'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { InventoryItem } from '@/types';
import { Button } from '@/components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';

interface MaterialSelectorProps {
    onSelectionChange: (materials: { item_id: string; quantity: number }[]) => void;
}

export function MaterialSelector({ onSelectionChange }: MaterialSelectorProps) {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [selectedMaterials, setSelectedMaterials] = useState<{ item_id: string; quantity: number }[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchItems();
    }, []);

    useEffect(() => {
        onSelectionChange(selectedMaterials);
    }, [selectedMaterials, onSelectionChange]);

    const fetchItems = async () => {
        try {
            const { data, error } = await supabase
                .from('inventory_items')
                .select('*')
                .order('name');

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching inventory items:', error);
        } finally {
            setLoading(false);
        }
    };

    const addMaterial = () => {
        if (items.length === 0) return;
        setSelectedMaterials([...selectedMaterials, { item_id: items[0].id, quantity: 1 }]);
    };

    const removeMaterial = (index: number) => {
        const newMaterials = [...selectedMaterials];
        newMaterials.splice(index, 1);
        setSelectedMaterials(newMaterials);
    };

    const updateMaterial = (index: number, field: 'item_id' | 'quantity', value: any) => {
        const newMaterials = [...selectedMaterials];
        newMaterials[index] = { ...newMaterials[index], [field]: value };
        setSelectedMaterials(newMaterials);
    };

    if (loading) return <div>Malzemeler yükleniyor...</div>;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-700">Malzeme Listesi</h3>
                <Button type="button" onClick={addMaterial} variant="outline" size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Malzeme Ekle
                </Button>
            </div>

            {selectedMaterials.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Henüz malzeme eklenmedi.</p>
            ) : (
                <div className="space-y-3">
                    {selectedMaterials.map((selection, index) => (
                        <div key={index} className="flex items-center space-x-3">
                            <select
                                className="flex-1 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selection.item_id}
                                onChange={(e) => updateMaterial(index, 'item_id', e.target.value)}
                            >
                                {items.map((item) => (
                                    <option key={item.id} value={item.id}>
                                        {item.name} ({item.unit}) - Stok: {item.current_stock}
                                    </option>
                                ))}
                            </select>

                            <input
                                type="number"
                                min="0.1"
                                step="0.1"
                                className="w-24 h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={selection.quantity}
                                onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value))}
                                placeholder="Miktar"
                            />

                            <Button type="button" variant="ghost" size="sm" onClick={() => removeMaterial(index)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
