'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter, FileText, Calendar, User, MapPin } from 'lucide-react';

interface JobReport {
    id: string;
    job_id: string;
    report_type: 'start' | 'end' | 'daily';
    description: string;
    created_at: string;
    jobs: {
        title: string;
    };
    profiles: {
        first_name: string;
        last_name: string;
    };
}

export default function ReportsPage() {
    const [reports, setReports] = useState<JobReport[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'start' | 'end'>('all');

    useEffect(() => {
        fetchReports();
    }, []);

    const fetchReports = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('job_reports')
                .select(`
                    *,
                    jobs (title),
                    profiles (first_name, last_name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setReports(data || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(report => {
        const matchesSearch =
            report.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            report.jobs?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            `${report.profiles?.first_name} ${report.profiles?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesType = filterType === 'all' || report.report_type === filterType;

        return matchesSearch && matchesType;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-gray-900">Raporlar</h1>
                <div className="flex items-center space-x-2">
                    <Button
                        variant={filterType === 'all' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('all')}
                    >
                        Tümü
                    </Button>
                    <Button
                        variant={filterType === 'start' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('start')}
                    >
                        Başlangıç
                    </Button>
                    <Button
                        variant={filterType === 'end' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setFilterType('end')}
                    >
                        Bitiş
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Rapor, iş veya personel ara..."
                            className="pl-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-8 text-gray-500">Raporlar yükleniyor...</div>
                        ) : filteredReports.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">Rapor bulunamadı.</div>
                        ) : (
                            filteredReports.map((report) => (
                                <div key={report.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex flex-col sm:flex-row justify-between gap-4 mb-2">
                                        <div className="flex items-center space-x-2">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${report.report_type === 'start'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {report.report_type === 'start' ? 'İş Başlangıcı' : 'İş Bitişi'}
                                            </span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {report.jobs?.title || 'İsimsiz İş'}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-sm text-gray-500 space-x-4">
                                            <div className="flex items-center">
                                                <User className="w-3 h-3 mr-1" />
                                                {report.profiles?.first_name} {report.profiles?.last_name}
                                            </div>
                                            <div className="flex items-center">
                                                <Calendar className="w-3 h-3 mr-1" />
                                                {new Date(report.created_at).toLocaleDateString('tr-TR', {
                                                    day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 whitespace-pre-wrap">
                                        {report.description}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
