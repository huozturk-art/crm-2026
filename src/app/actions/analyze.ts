'use server';

import { analyzeImages } from '@/lib/gemini';

export async function analyzeJobImages(imageUrls: string[], type: 'start' | 'end') {
    if (!imageUrls || imageUrls.length === 0) {
        return { error: 'Analiz için en az bir görsel gereklidir.' };
    }

    let prompt = "";

    if (type === 'start') {
        prompt = `
      Sen profesyonel bir saha operasyon uzmanısın. Bu fotoğraflar bir teknik servis veya montaj işinin BAŞLANGICINDA çekildi.
      Lütfen fotoğrafları analiz et ve şunları çıkar:
      1. Mevcut durum nedir? (Örn: Eski cihaz duvarda asılı, kablolar dağınık, boş bir duvar var vb.)
      2. Yapılacak iş neye benziyor? (Örn: Klima montajı, kablo çekimi, arıza tespiti vb.)
      3. Görünen riskler veya dikkat edilmesi gerekenler var mı?
      
      Yanıtını kısa, maddeler halinde ve profesyonel bir dille Türkçe olarak ver.
    `;
    } else {
        prompt = `
      Sen profesyonel bir saha operasyon uzmanısın. Bu fotoğraflar bir teknik servis veya montaj işinin BİTİMİNDE çekildi.
      Lütfen fotoğrafları analiz et ve şunları çıkar:
      1. Yapılan iş nedir? (Örn: Yeni klima takılmış, kablolar kanala alınmış vb.)
      2. Kullanılan malzemeler neler olabilir? (Görselden tespit edebildiğin kadarıyla. Örn: 3 metre kablo, 1 adet sigorta, dübel vb.)
      3. İşçilik kalitesi nasıl görünüyor? (Temiz, düzenli vb.)
      
      Yanıtını kısa, maddeler halinde ve profesyonel bir dille Türkçe olarak ver.
    `;
    }

    try {
        const analysis = await analyzeImages(imageUrls, prompt);
        return { success: true, analysis };
    } catch (error) {
        console.error('AI Analysis Error:', error);
        return { success: false, error: 'AI analizi yapılamadı.' };
    }
}
