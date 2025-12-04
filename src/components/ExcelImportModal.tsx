'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { bulkCreateInventory } from '@/app/actions/inventory';

interface ExcelImportModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError(null);
            readExcel(selectedFile);
        }
    };

    const readExcel = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);
                setPreviewData(jsonData.slice(0, 5)); // Show first 5 rows
            } catch (err) {
                setError('Dosya okunamadı. Lütfen geçerli bir Excel dosyası yükleyin.');
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                const result = await bulkCreateInventory(jsonData);

                if (result.success) {
                    setSuccessMessage(`${result.count} ürün başarıyla yüklendi!`);
                    setTimeout(() => {
                        onSuccess();
                        onClose();
                    }, 2000);
                } else {
                    setError(result.error || 'Yükleme başarısız.');
                }
            } catch (err) {
                setError('İşlem sırasında hata oluştu.');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const downloadTemplate = () => {
        const templateData = [
            { "Ürün Adı": "Örnek Ürün 1", "Stok": 100, "Birim": "Adet", "Kritik Stok": 10 },
            { "Ürün Adı": "Örnek Ürün 2", "Stok": 50, "Birim": "Metre", "Kritik Stok": 5 }
        ];
        const ws = XLSX.utils.json_to_sheet(templateData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Şablon");
        XLSX.writeFile(wb, "Stok_Yukleme_Sablonu.xlsx");
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold flex items-center">
                        <FileSpreadsheet className="w-6 h-6 mr-2 text-green-600" />
                        Excel ile Toplu Stok Yükleme
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="space-y-6">
                    {/* Step 1: Template */}
                    <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                        <h3 className="font-medium text-blue-800 mb-2">1. Adım: Şablonu İndirin</h3>
                        <p className="text-sm text-blue-600 mb-3">
                            Verilerinizi doğru formatta yüklemek için örnek şablonu kullanın.
                            Sütun isimleri: <strong>Ürün Adı, Stok, Birim, Kritik Stok</strong> olmalıdır.
                        </p>
                        <Button variant="outline" size="sm" onClick={downloadTemplate} className="bg-white">
                            <Download className="w-4 h-4 mr-2" />
                            Şablonu İndir
                        </Button>
                    </div>

                    {/* Step 2: Upload */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:bg-gray-50 transition-colors">
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            onChange={handleFileChange}
                            className="hidden"
                            id="excel-upload"
                        />
                        <label htmlFor="excel-upload" className="cursor-pointer flex flex-col items-center">
                            <Upload className="w-12 h-12 text-gray-400 mb-3" />
                            <span className="text-gray-600 font-medium">Excel Dosyasını Seçin veya Sürükleyin</span>
                            <span className="text-xs text-gray-400 mt-1">.xlsx veya .xls</span>
                        </label>
                        {file && (
                            <div className="mt-4 flex items-center justify-center text-green-600 font-medium">
                                <FileSpreadsheet className="w-4 h-4 mr-2" />
                                {file.name}
                            </div>
                        )}
                    </div>

                    {/* Preview */}
                    {previewData.length > 0 && (
                        <div>
                            <h4 className="font-medium mb-2 text-gray-700">Önizleme (İlk 5 Satır):</h4>
                            <div className="overflow-x-auto border rounded-md">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-700">
                                        <tr>
                                            {Object.keys(previewData[0]).map((key) => (
                                                <th key={key} className="px-4 py-2 border-b">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row, i) => (
                                            <tr key={i} className="border-b last:border-0">
                                                {Object.values(row).map((val: any, j) => (
                                                    <td key={j} className="px-4 py-2">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Messages */}
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center">
                            <AlertCircle className="w-5 h-5 mr-2" />
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="bg-green-50 text-green-600 p-3 rounded-md flex items-center">
                            <CheckCircle className="w-5 h-5 mr-2" />
                            {successMessage}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button variant="ghost" onClick={onClose}>İptal</Button>
                        <Button
                            onClick={handleUpload}
                            disabled={!file || loading}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            {loading ? 'Yükleniyor...' : 'Verileri İçeri Aktar'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
