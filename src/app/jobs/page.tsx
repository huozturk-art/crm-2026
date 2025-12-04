'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Job } from '@/types';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Plus, Calendar, MapPin, User } from 'lucide-react';
import Link from 'next/link';

export default function JobsPage() {
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchJobs();
    }, []);

    const fetchJobs = async () => {
        try {
            const { data, error } = await supabase
                .from('jobs')
                .select(`
          *,
          project:projects(name, address),
          assignee:profiles(first_name, last_name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setJobs(data || []);
        } catch (error) {
            console.error('Error fetching jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'planned': return 'bg-blue-100 text-blue-800';
            case 'in_progress': return 'bg-yellow-100 text-yellow-800';
            case 'completed': return 'bg-green-100 text-green-800';
            case 'cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'planned': return 'Planlandı';
            case 'in_progress': return 'Devam Ediyor';
            case 'completed': return 'Tamamlandı';
            case 'cancelled': return 'İptal';
            default: return status;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">İş Emirleri</h1>
                <Link href="/jobs/new">
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Yeni İş Emri
                    </Button>
                </Link>
            </div>

            {loading ? (
                <div className="text-center py-10">Yükleniyor...</div>
            ) : jobs.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-lg border border-gray-200">
                    <p className="text-gray-500">Henüz kayıtlı iş emri yok.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.map((job) => (
                        <Link key={job.id} href={`/jobs/${job.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                            {getStatusText(job.status)}
                                        </span>
                                        {job.planned_start_date && (
                                            <span className="text-xs text-gray-500 flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(job.planned_start_date).toLocaleDateString('tr-TR')}
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{job.title}</h3>
                                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{job.description}</p>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 space-y-2">
                                        {job.project && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                                                <span className="truncate">{job.project.name}</span>
                                            </div>
                                        )}
                                        {job.assignee && (
                                            <div className="flex items-center text-sm text-gray-600">
                                                <User className="w-4 h-4 mr-2 text-gray-400" />
                                                <span>{job.assignee.first_name} {job.assignee.last_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
