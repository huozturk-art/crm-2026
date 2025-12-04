'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Search, Filter, FileText, Calendar, User, MapPin, Image as ImageIcon, Sparkles } from 'lucide-react';
import Image from 'next/image';

interface JobReport {
    id: string;
    job_id: string;
    report_type: 'start' | 'end' | 'daily';
    description: string;
    created_at: string;
    media_urls: string[] | null;
    ai_analysis: string | null;
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
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Saha Raporları</h1>
                    <p className="text-sm text-gray-500">WhatsApp'tan gelen fotoğraflar ve AI analizleri</p>
                </div>
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

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                    placeholder="Rapor, iş veya personel ara..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-64 bg-gray-100 rounded-lg animate-pulse"></div>
                    ))}
                </div>
            ) : filteredReports.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                    <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">Henüz hiç rapor bulunamadı.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredReports.map((report) => (
                        <Card key={report.id} className="overflow-hidden hover:shadow-md transition-shadow flex flex-col">
                            {/* Image Section */}
                            <div className="relative h-48 bg-gray-100">
                                {report.media_urls && report.media_urls.length > 0 ? (
                                    <img
                                        src={report.media_urls[0]}
                                        alt="Rapor Görseli"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center h-full text-gray-400">
                                        <ImageIcon className="w-10 h-10" />
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium shadow-sm ${report.report_type === 'start'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-green-500 text-white'
                                        }`}>
                                        {report.report_type === 'start' ? 'Başlangıç' : 'Bitiş'}
                                    </span>
                                </div>
                            </div>

                            <CardContent className="p-4 flex-1">
                                <div className="mb-3">
                                    <h3 className="font-semibold text-gray-900 line-clamp-1">
                                        {report.jobs?.title || 'İsimsiz İş'}
                                    </h3>
                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                        <User className="w-3 h-3 mr-1" />
                                        {report.profiles?.first_name} {report.profiles?.last_name}
                                        <span className="mx-2">•</span>
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {new Date(report.created_at).toLocaleDateString('tr-TR', {
                                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                                        })}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {report.ai_analysis && (
                                        <div className="bg-purple-50 p-3 rounded-md border border-purple-100">
                                            <div className="flex items-center text-purple-700 text-xs font-bold mb-1">
                                                <Sparkles className="w-3 h-3 mr-1" />
                                                AI Analizi
                                            </div>
                                            <p className="text-xs text-purple-900 line-clamp-3">
                                                {report.ai_analysis}
                                            </p>
                                        </div>
                                    )}

                                    <p className="text-sm text-gray-600 line-clamp-3">
                                        {report.description}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
