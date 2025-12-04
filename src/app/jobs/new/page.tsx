'use client';

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ArrowLeft, Save, Plus } from 'lucide-react';
import Link from 'next/link';

export default function NewJobPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [profiles, setProfiles] = useState<any[]>([]);
    const [customers, setCustomers] = useState<any[]>([]);

    // Modal states
    const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
    const [newProjectForm, setNewProjectForm] = useState({ name: '', address: '', customer_id: '' });

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        project_id: '',
        assigned_to: '',
        planned_start_date: '',
        planned_end_date: '',
        status: 'planned'
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        // Projeleri çek
        const { data: projectsData } = await supabase.from('projects').select('id, name').eq('status', 'active');
        if (projectsData) setProjects(projectsData);

        // Personeli çek
        const { data: profilesData } = await supabase.from('profiles').select('id, first_name, last_name').eq('is_active', true);
        if (profilesData) setProfiles(profilesData);

        // Müşterileri çek (Modal için)
        const { data: customersData } = await supabase.from('customers').select('id, company_name');
        if (customersData) setCustomers(customersData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data, error } = await supabase
                .from('jobs')
                .insert([
                    {
                        title: formData.title,
                        description: formData.description,
                        project_id: formData.project_id,
                        assigned_to: formData.assigned_to || null,
                        planned_start_date: formData.planned_start_date || null,
                        planned_end_date: formData.planned_end_date || null,
                        status: formData.status
                    }
                ])
                .select()
                .single();

            if (error) throw error;

            router.push(`/jobs/${data.id}`);
        } catch (error) {
            console.error('Error creating job:', error);
            alert('İş emri oluşturulurken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProject = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const { data, error } = await supabase
                .from('projects')
                .insert([newProjectForm])
                .select()
                .single();

            if (error) throw error;

            // Listeyi güncelle ve yeni projeyi seç
            setProjects([...projects, data]);
            setFormData({ ...formData, project_id: data.id });
            setIsProjectModalOpen(false);
            setNewProjectForm({ name: '', address: '', customer_id: '' });
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Proje oluşturulurken hata oluştu.');
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/jobs">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        İptal
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Yeni İş Emri</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>İş Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">İş Başlığı</label>
                            <Input
                                required
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Örn: Klima Montajı"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                placeholder="İşin detayları..."
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Proje / Şantiye</label>
                            <div className="flex gap-2">
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    value={formData.project_id}
                                    onChange={e => setFormData({ ...formData, project_id: e.target.value })}
                                >
                                    <option value="">Seçiniz</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                                <Button type="button" variant="outline" onClick={() => setIsProjectModalOpen(true)}>
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Atanan Personel</label>
                            <select
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={formData.assigned_to}
                                onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                            >
                                <option value="">Atanmadı</option>
                                {profiles.map(p => (
                                    <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan Başlangıç</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.planned_start_date}
                                    onChange={e => setFormData({ ...formData, planned_start_date: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Planlanan Bitiş</label>
                                <Input
                                    type="datetime-local"
                                    value={formData.planned_end_date}
                                    onChange={e => setFormData({ ...formData, planned_end_date: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button type="submit" disabled={loading} className="w-full">
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Oluşturuluyor...' : 'İş Emri Oluştur'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Hızlı Proje Ekleme Modalı */}
            {isProjectModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4">Hızlı Proje Ekle</h2>
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Müşteri</label>
                                <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                    value={newProjectForm.customer_id}
                                    onChange={e => setNewProjectForm({ ...newProjectForm, customer_id: e.target.value })}
                                >
                                    <option value="">Müşteri Seçiniz</option>
                                    {customers.map(c => (
                                        <option key={c.id} value={c.id}>{c.company_name}</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Listede yoksa önce Müşteriler sayfasından ekleyin.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proje / Şantiye Adı</label>
                                <Input required value={newProjectForm.name} onChange={e => setNewProjectForm({ ...newProjectForm, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
                                <Input value={newProjectForm.address} onChange={e => setNewProjectForm({ ...newProjectForm, address: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <Button type="button" variant="ghost" onClick={() => setIsProjectModalOpen(false)}>İptal</Button>
                                <Button type="submit">Ekle ve Seç</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
