'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search, UserPlus, Edit2, Shield, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { createStaffUser } from '@/app/actions/staff';

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    phone: string | null;
    role: 'admin' | 'staff';
    is_active: boolean;
    email?: string;
}

export default function StaffPage() {
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Modal State
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    // Add Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        fetchProfiles();
    }, []);

    const fetchProfiles = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('first_name', { ascending: true });

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error('Error fetching profiles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingProfile) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({
                    first_name: editingProfile.first_name,
                    last_name: editingProfile.last_name,
                    phone: editingProfile.phone,
                    role: editingProfile.role,
                    is_active: editingProfile.is_active
                })
                .eq('id', editingProfile.id);

            if (error) throw error;

            setProfiles(profiles.map(p => p.id === editingProfile.id ? editingProfile : p));
            setIsEditModalOpen(false);
            setEditingProfile(null);
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Güncelleme sırasında bir hata oluştu.');
        }
    };

    const handleAddStaff = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsAdding(true);

        const formData = new FormData(e.currentTarget);

        try {
            const result = await createStaffUser(formData);

            if (result.success) {
                alert('Personel başarıyla oluşturuldu.');
                setIsAddModalOpen(false);
                fetchProfiles();
            } else {
                alert('Hata: ' + result.error);
            }
        } catch (error) {
            console.error('Add staff error:', error);
            alert('Beklenmeyen bir hata oluştu.');
        } finally {
            setIsAdding(false);
        }
    };

    const filteredProfiles = profiles.filter(profile =>
        `${profile.first_name} ${profile.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        profile.phone?.includes(searchTerm)
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Personel Yönetimi</h1>
                <Button className="bg-primary hover:bg-primary/90" onClick={() => setIsAddModalOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Yeni Personel Ekle
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="İsim veya telefon ile ara..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3">Ad Soyad</th>
                                    <th className="px-6 py-3">Telefon</th>
                                    <th className="px-6 py-3">Rol</th>
                                    <th className="px-6 py-3">Durum</th>
                                    <th className="px-6 py-3 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center">Yükleniyor...</td>
                                    </tr>
                                ) : filteredProfiles.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">Kayıt bulunamadı.</td>
                                    </tr>
                                ) : (
                                    filteredProfiles.map((profile) => (
                                        <tr key={profile.id} className="bg-white border-b hover:bg-gray-50">
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {profile.first_name} {profile.last_name}
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {profile.phone || '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {profile.role === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : null}
                                                    {profile.role === 'admin' ? 'Yönetici' : 'Personel'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile.is_active
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {profile.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
                                                    {profile.is_active ? 'Aktif' : 'Pasif'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setEditingProfile(profile);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                >
                                                    <Edit2 className="w-4 h-4 text-gray-500 hover:text-primary" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Yeni Personel Ekle</h2>
                        <form onSubmit={handleAddStaff} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                                    <Input name="first_name" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                                    <Input name="last_name" required />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
                                <Input name="email" type="email" required />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Şifre</label>
                                <Input name="password" type="password" required minLength={6} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                <Input name="phone" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select
                                    name="role"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                >
                                    <option value="staff">Saha Personeli</option>
                                    <option value="admin">Yönetici</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
                                    İptal
                                </Button>
                                <Button type="submit" disabled={isAdding}>
                                    {isAdding ? 'Ekleniyor...' : 'Ekle'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {isEditModalOpen && editingProfile && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Personel Düzenle</h2>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                                    <Input
                                        value={editingProfile.first_name}
                                        onChange={e => setEditingProfile({ ...editingProfile, first_name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Soyad</label>
                                    <Input
                                        value={editingProfile.last_name}
                                        onChange={e => setEditingProfile({ ...editingProfile, last_name: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                <Input
                                    value={editingProfile.phone || ''}
                                    onChange={e => setEditingProfile({ ...editingProfile, phone: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    value={editingProfile.role}
                                    onChange={e => setEditingProfile({ ...editingProfile, role: e.target.value as 'admin' | 'staff' })}
                                >
                                    <option value="staff">Saha Personeli</option>
                                    <option value="admin">Yönetici</option>
                                </select>
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
                                    checked={editingProfile.is_active}
                                    onChange={e => setEditingProfile({ ...editingProfile, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                    Hesap Aktif
                                </label>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>
                                    İptal
                                </Button>
                                <Button type="submit">
                                    Kaydet
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
