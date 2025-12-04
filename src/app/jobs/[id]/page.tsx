'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Job } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calendar, MapPin, User, ArrowLeft, FileText, Package } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function JobDetailPage() {
    const params = useParams();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            fetchJobDetail(params.id as string);
        }
    }, [params.id]);

    const fetchJobDetail = async (id: string) => {
        console.log('Fetching job detail for ID:', id);
        try {
            // Aliases can sometimes cause issues if relationships are not perfectly detected.
            // Trying without aliases first and mapping manually.
            const { data, error } = await supabase
                .from('jobs')
                .select(`
                    *,
                    projects (
                        *,
                        customers (*)
                    ),
                    profiles (*)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Supabase error:', error);
                throw error;
            }

            console.log('Job data fetched:', data);

            // Map the data to match our Job type
            const formattedJob: any = {
                ...data,
                project: data.projects, // Supabase returns the relation as the table name
                assignee: data.profiles,
            };

            // Handle nested customer mapping if needed
            if (formattedJob.project && formattedJob.project.customers) {
                formattedJob.project.customer = formattedJob.project.customers;
            }

            setJob(formattedJob);
        } catch (error: any) {
            console.error('Error fetching job detail:', error.message || error);
            // If error is empty object, try to log stringified
            if (Object.keys(error).length === 0) {
                console.error('Empty error object. Full error:', JSON.stringify(error, null, 2));
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-6">Yükleniyor...</div>;
    if (!job) return <div className="p-6">İş emri bulunamadı.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/jobs">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Geri
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">İş Detayı</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Sol Kolon: İş Bilgileri */}
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{job.title}</CardTitle>
                                    <p className="text-sm text-gray-500 mt-1">#{job.id.slice(0, 8)}</p>
                                </div>
                                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    {job.status}
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-500 mb-2">Açıklama</h4>
                                <p className="text-gray-900">{job.description || 'Açıklama yok.'}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-start space-x-3">
                                    <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Şantiye / Proje</p>
                                        <p className="text-sm text-gray-600">{job.project?.name}</p>
                                        <p className="text-xs text-gray-500">{job.project?.address}</p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <User className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Atanan Personel</p>
                                        <p className="text-sm text-gray-600">
                                            {job.assignee ? `${job.assignee.first_name} ${job.assignee.last_name}` : 'Atanmamış'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Planlanan Tarih</p>
                                        <p className="text-sm text-gray-600">
                                            {job.planned_start_date ? new Date(job.planned_start_date).toLocaleDateString('tr-TR') : '-'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Raporlar Bölümü */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>İş Raporları</CardTitle>
                            <div className="space-x-2">
                                <Button size="sm" variant="outline">
                                    <FileText className="w-4 h-4 mr-2" />
                                    Rapor Ekle
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8 text-gray-500">
                                Henüz rapor girilmemiş.
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sağ Kolon: Aksiyonlar ve Malzeme */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Hızlı İşlemler</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Link href={`/jobs/${job.id}/report/start`} className="block w-full">
                                <Button className="w-full justify-start" variant="primary">
                                    <FileText className="w-4 h-4 mr-2" />
                                    İşe Başlama Raporu Gir
                                </Button>
                            </Link>
                            <Link href={`/jobs/${job.id}/report/end`} className="block w-full">
                                <Button className="w-full justify-start" variant="secondary">
                                    <FileText className="w-4 h-4 mr-2" />
                                    İş Bitiş Raporu Gir
                                </Button>
                            </Link>
                            <Button className="w-full justify-start" variant="outline">
                                <Package className="w-4 h-4 mr-2" />
                                Malzeme Talebi
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Kullanılan Malzemeler</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-gray-500">
                                Henüz malzeme kullanımı yok.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
