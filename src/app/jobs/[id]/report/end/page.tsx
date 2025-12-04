'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { MaterialSelector } from '@/components/reports/MaterialSelector';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { ArrowLeft, Save, Wand2 } from 'lucide-react';
import Link from 'next/link';
import { analyzeJobImages } from '@/app/actions/analyze';

export default function JobEndReportPage() {
    const params = useParams();
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [materialsReturned, setMaterialsReturned] = useState<{ item_id: string; quantity: number }[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [uploadedImages, setUploadedImages] = useState<string[]>([]);

    const handleAnalyze = async () => {
        if (uploadedImages.length === 0) {
            alert('Lütfen önce fotoğraf yükleyiniz.');
            return;
        }

        setAnalyzing(true);
        try {
            const result = await analyzeJobImages(uploadedImages, 'end');
            if (result.success && result.analysis) {
                setDescription(prev => prev + (prev ? '\n\n' : '') + '--- AI Analizi ---\n' + result.analysis);
            } else {
                alert(result.error || 'Analiz yapılamadı.');
            }
        } catch (error) {
            console.error('Analysis error:', error);
            alert('Bir hata oluştu.');
        } finally {
            setAnalyzing(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Raporu oluştur
            const { error: reportError } = await supabase
                .from('job_reports')
                .insert({
                    job_id: params.id,
                    report_type: 'end',
                    description,
                    materials_returned: materialsReturned,
                    media_urls: uploadedImages,
                    // materials_used: (backend trigger ile veya burada hesaplanabilir, şimdilik basit tutalım)
                });

            if (reportError) throw reportError;

            // 2. Depo hareketlerini oluştur (Giriş - İade)
            if (materialsReturned.length > 0) {
                const movements = materialsReturned.map(m => ({
                    item_id: m.item_id,
                    job_id: params.id,
                    movement_type: 'in', // İade
                    quantity: m.quantity,
                    description: 'İş bitiş - İade edilen malzeme',
                    date: new Date().toISOString(),
                }));

                const { error: movementError } = await supabase
                    .from('inventory_movements')
                    .insert(movements);

                if (movementError) throw movementError;
            }

            // 3. Kullanılan malzemeleri hesapla ve düş (Opsiyonel ama önemli)
            // Bu adımda normalde "Götürülen - Getirilen = Kullanılan" mantığı işletilmeli.
            // Şimdilik basitçe "Kullanım" hareketi de oluşturulabilir veya bu hesaplama backend'e bırakılabilir.
            // Biz burada basitçe işi 'completed' yapalım.

            const { error: jobError } = await supabase
                .from('jobs')
                .update({ status: 'completed' })
                .eq('id', params.id);

            if (jobError) throw jobError;

            router.push(`/jobs/${params.id}`);
        } catch (err: any) {
            console.error('Error submitting report:', err);
            setError(err.message || 'Rapor gönderilirken bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link href={`/jobs/${params.id}`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        İptal
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">İş Bitiş Raporu</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Rapor Detayları</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Yapılan İş Özeti
                            </label>
                            <textarea
                                className="w-full min-h-[100px] px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Neler yapıldı, karşılaşılan sorunlar..."
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                            />
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Geri Getirilen Malzemeler</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Kullanılmayıp geri getirdiğiniz malzemeleri seçiniz. Bunlar depoya "Giriş" olarak eklenecektir.
                            </p>
                            <MaterialSelector onSelectionChange={setMaterialsReturned} />
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Fotoğraf Ekle</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Yapılan işi gösteren fotoğraflar yükleyiniz.
                            </p>
                            <ImageUploader
                                folderPath={`job-reports/${params.id}/end`}
                                onImagesSelected={setUploadedImages}
                            />

                            {uploadedImages.length > 0 && (
                                <div className="mt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleAnalyze}
                                        disabled={analyzing}
                                        className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50"
                                    >
                                        <Wand2 className="w-4 h-4 mr-2" />
                                        {analyzing ? 'AI Fotoğrafları İnceliyor...' : 'AI ile Analiz Et ve Özeti Doldur'}
                                    </Button>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-6">
                            <Button type="submit" disabled={loading} className="w-full md:w-auto bg-green-600 hover:bg-green-700">
                                <Save className="w-4 h-4 mr-2" />
                                {loading ? 'Kaydediliyor...' : 'Raporu Kaydet ve İşi Bitir'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
