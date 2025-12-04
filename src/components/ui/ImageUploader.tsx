'use client';

import { useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { Button } from '@/components/ui/Button';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

interface ImageUploaderProps {
    onImagesSelected: (urls: string[]) => void;
    folderPath: string; // e.g., 'job-reports/job-123'
}

export function ImageUploader({ onImagesSelected, folderPath }: ImageUploaderProps) {
    const [images, setImages] = useState<string[]>([]); // URLs of uploaded images
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) return;

        setUploading(true);
        const files = Array.from(event.target.files);
        const uploadedUrls: string[] = [];

        try {
            for (const file of files) {
                // 1. Compress image
                const options = {
                    maxSizeMB: 1, // Max 1MB
                    maxWidthOrHeight: 1920,
                    useWebWorker: true,
                };

                const compressedFile = await imageCompression(file, options);

                // 2. Upload to Supabase Storage
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `${folderPath}/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('crm-media') // We need to create this bucket!
                    .upload(filePath, compressedFile);

                if (uploadError) throw uploadError;

                // 3. Get Public URL
                const { data } = supabase.storage
                    .from('crm-media')
                    .getPublicUrl(filePath);

                uploadedUrls.push(data.publicUrl);
            }

            const newImages = [...images, ...uploadedUrls];
            setImages(newImages);
            onImagesSelected(newImages);

        } catch (error) {
            console.error('Error uploading images:', error);
            alert('Resim yüklenirken bir hata oluştu.');
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeImage = (index: number) => {
        const newImages = [...images];
        newImages.splice(index, 1);
        setImages(newImages);
        onImagesSelected(newImages);
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
                {images.map((url, index) => (
                    <div key={index} className="relative w-24 h-24 border rounded-lg overflow-hidden group">
                        <img src={url} alt="Uploaded" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                ))}

                <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                >
                    {uploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                    ) : (
                        <>
                            <Upload className="w-6 h-6 text-gray-400 mb-1" />
                            <span className="text-xs text-gray-500">Ekle</span>
                        </>
                    )}
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                multiple
                className="hidden"
            />
        </div>
    );
}
