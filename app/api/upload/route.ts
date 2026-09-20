import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/adminAuth';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export const maxDuration = 60; // 60초 타임아웃 (Vercel Pro)

const supabase = getSupabaseServer();

function isValidImageMagicBytes(buffer: ArrayBuffer): boolean {
    if (buffer.byteLength < 12) return false;
    const bytes = new Uint8Array(buffer.slice(0, 12));

    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
    // GIF: GIF87a or GIF89a (47 49 46 38)
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return true;
    // WEBP: RIFF....WEBP (52 49 46 46 .... 57 45 42 50)
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;

    return false;
}

const EXT_MAP: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
};

export async function POST(req: NextRequest) {
    try {
        const authError = await requireAdmin();
        if (authError) return authError;

        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (!ALLOWED_TYPES.includes(file.type)) {
            return NextResponse.json({ error: '허용되지 않는 파일 형식입니다. (jpg, png, webp, gif만 가능)' }, { status: 400 });
        }
        if (file.size > MAX_SIZE) {
            return NextResponse.json({ error: '파일 크기는 5MB 이하만 가능합니다.' }, { status: 400 });
        }

        const buffer = await file.arrayBuffer();

        // Magic Byte 서명 검증 (위장된 SVG/HTML XSS 공격 차단)
        if (!isValidImageMagicBytes(buffer)) {
            return NextResponse.json({ error: '유효하지 않은 이미지 파일 바이너리입니다.' }, { status: 400 });
        }

        const safeExt = EXT_MAP[file.type] || 'jpg';
        const fileName = `uploads/${Date.now()}_${Math.random().toString(36).substring(7)}.${safeExt}`;

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
        return NextResponse.json({ error: '파일 업로드 처리에 실패했습니다.' }, { status: 500 });
    }
}
