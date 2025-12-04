'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Search, Plus, Building, MapPin, Phone, Edit2, Trash2, Users } from 'lucide-react';
import { Customer, Project } from '@/types';

export default function CustomersPage() {
    const [customers, setCustomers] = useState<(Customer & { projects: Project[] })[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal states
    const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    // Form states
    const [customerForm, setCustomerForm] = useState({ company_name: '', contact_person: '', phone: '', address: '' });
    const [projectForm, setProjectForm] = useState({ name: '', address: '', description: '', customer_id: '' });

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('customers')
                .select(`
                    *,
                    projects (*)
                `)
                .order('company_name');

            if (error) throw error;
            setCustomers(data || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateCustomer = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('customers').insert([customerForm]);
            if (error) throw error;

            setIsCustomerModalOpen(false);
            setCustomerForm({ company_name: '', contact_person: '', phone: '', address: '' });
            fetchCustomers();
        } catch (error) {
            console.error('Error creating customer:', error);
            alert('Müşteri oluşturulurken hata oluştu.');
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { error } = await supabase.from('projects').insert([{
                ...projectForm,
                customer_id: selectedCustomer?.id
            }]);
            if (error) throw error;

            setIsProjectModalOpen(false);
            setProjectForm({ name: '', address: '', description: '', customer_id: '' });
            fetchCustomers();
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Proje oluşturulurken hata oluştu.');
        }
    };

    const filteredCustomers = customers.filter(c =>
        c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.contact_person?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Müşteriler ve Projeler</h1>
                <Button onClick={() => setIsCustomerModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Yeni Müşteri Ekle
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Müşteri veya yetkili ara..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Yükleniyor...</div>
                        ) : filteredCustomers.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Kayıt bulunamadı.</div>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <div key={customer.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                                                <Building className="w-5 h-5 mr-2 text-gray-500" />
                                                {customer.company_name}
                                            </h3>
                                            <div className="text-sm text-gray-500 mt-1 space-y-1">
                                                <p className="flex items-center"><Users className="w-4 h-4 mr-2" /> {customer.contact_person || '-'}</p>
                                                <p className="flex items-center"><Phone className="w-4 h-4 mr-2" /> {customer.phone || '-'}</p>
                                                <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> {customer.address || '-'}</p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedCustomer(customer);
                                                setIsProjectModalOpen(true);
                                            }}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Proje Ekle
                                        </Button>
                                    </div>

                                    {/* Projeler Listesi */}
                                    <div className="bg-gray-50 rounded-md p-3">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Projeler / Şantiyeler</h4>
                                        {customer.projects && customer.projects.length > 0 ? (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {customer.projects.map(project => (
                                                    <div key={project.id} className="bg-white p-3 rounded border border-gray-200 text-sm">
                                                        <div className="font-medium text-gray-900">{project.name}</div>
                                                        <div className="text-gray-500 text-xs mt-1">{project.address}</div>
                                                        <div className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full ${project.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                                            }`}>
                                                            {project.status === 'active' ? 'Aktif' : 'Pasif'}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 italic">Henüz proje eklenmemiş.</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Müşteri Ekleme Modalı */}
            {isCustomerModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Yeni Müşteri Ekle</h2>
                        <form onSubmit={handleCreateCustomer} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı</label>
                                <Input required value={customerForm.company_name} onChange={e => setCustomerForm({ ...customerForm, company_name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Yetkili Kişi</label>
                                <Input value={customerForm.contact_person} onChange={e => setCustomerForm({ ...customerForm, contact_person: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                                <Input value={customerForm.phone} onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                                <Input value={customerForm.address} onChange={e => setCustomerForm({ ...customerForm, address: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsCustomerModalOpen(false)}>İptal</Button>
                                <Button type="submit">Kaydet</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Proje Ekleme Modalı */}
            {isProjectModalOpen && selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Yeni Proje Ekle ({selectedCustomer.company_name})</h2>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proje / Şantiye Adı</label>
                                <Input required value={projectForm.name} onChange={e => setProjectForm({ ...projectForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                                <Input value={projectForm.address} onChange={e => setProjectForm({ ...projectForm, address: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                                <Input value={projectForm.description} onChange={e => setProjectForm({ ...projectForm, description: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsProjectModalOpen(false)}>İptal</Button>
                                <Button type="submit">Kaydet</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
