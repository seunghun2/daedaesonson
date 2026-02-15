import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

// Vercel serverless 설정: 바디 사이즈 제한 확장 & 타임아웃
export const config = {
    api: {
        bodyParser: false, // FormData 직접 처리
    },
};
export const maxDuration = 60; // 60초 타임아웃 (Vercel Pro)

const supabase = getSupabaseServer();

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();
        const fileExt = file.name.split('.').pop();
        const fileName = `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data, error } = await supabase.storage
            .from('facilities')
            .upload(fileName, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw error;
        }

        // Get Public URL
        const { data: publicUrlData } = supabase.storage
            .from('facilities')
            .getPublicUrl(fileName);

        return NextResponse.json({ url: publicUrlData.publicUrl });
    } catch (error) {
        console.error('Upload handler error:', error);
        return NextResponse.json({ error: 'Upload failed', details: String(error) }, { status: 500 });
    }
}
