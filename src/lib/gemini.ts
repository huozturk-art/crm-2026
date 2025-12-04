import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from '@/lib/env';

const apiKey = env.GEMINI_API_KEY;

if (!apiKey) {
    console.warn("GEMINI_API_KEY is not defined in environment variables.");
}

const genAI = new GoogleGenerativeAI(apiKey || "");

export async function analyzeImages(imageUrls: string[], prompt: string) {
    if (!apiKey) {
        throw new Error("Gemini API key is missing.");
    }

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const imageParts = await Promise.all(
            imageUrls.map(async (url) => {
                // Check if url is base64
                if (url.startsWith('data:image') || !url.startsWith('http')) {
                    // Assume base64 string without prefix or with prefix
                    const base64Data = url.includes('base64,') ? url.split('base64,')[1] : url;
                    return {
                        inlineData: {
                            data: base64Data,
                            mimeType: "image/jpeg", // Default or detect
                        },
                    };
                }

                const response = await fetch(url);
                const buffer = await response.arrayBuffer();
                return {
                    inlineData: {
                        data: Buffer.from(buffer).toString("base64"),
                        mimeType: response.headers.get("content-type") || "image/jpeg",
                    },
                };
            })
        );

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error("Error analyzing images with Gemini:", error);
        throw new Error("Görüntü analizi sırasında bir hata oluştu.");
    }
}

export async function analyzeImage(imageBase64: string, mimeType: string = 'image/jpeg') {
    return analyzeImages([imageBase64], "Bu görseldeki yapılan işi ve kullanılan malzemeleri detaylıca analiz et. Türkçe yanıt ver.");
}
