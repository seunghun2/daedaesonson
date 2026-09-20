import { rateLimit } from '@/lib/rateLimit';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/adminAuth';

const supabase = getSupabaseServer();

// GET: 1:1 문의 목록 (어드민용)
export async function GET() {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { data, error } = await supabase
            .from('contact_inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('1:1 문의 조회 오류:', error);
        return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
    }
}

// POST: 1:1 문의 등록 (사용자용)
export async function POST(request: Request) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
        const rateCheck = rateLimit({ key: `contact-post:${ip}`, limit: 10, windowMs: 60000 });
        if (!rateCheck.success) return NextResponse.json({ error: '너무 많은 요청입니다.' }, { status: 429 });
        
        const body = await request.json();
        const { inquiry_type, title, content, contact } = body;

        if (!inquiry_type || !title || !content || !contact) {
            return NextResponse.json({ error: '모든 필드를 입력해주세요' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('contact_inquiries')
            .insert({
                inquiry_type,
                title,
                content,
                contact,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('1:1 문의 등록 오류:', error);
        return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
    }
}
