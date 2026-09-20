import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { rateLimit } from '@/lib/rateLimit';
import { timingSafeCompare } from '@/lib/adminAuth';

const supabase = getSupabaseServer();

// 비밀번호 검증 (POST)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
        const body = await request.json();
        const { inquiryId, pin } = body;

        if (!inquiryId || !pin || typeof pin !== 'string') {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
        }

        // Rate limit: 5 attempts per minute per IP + inquiry
        const rateCheck = rateLimit({
            key: `inquiry-pin:${ip}:${inquiryId}`,
            limit: 5,
            windowMs: 60000,
        });

        if (!rateCheck.success) {
            return NextResponse.json(
                { error: '비밀번호 확인 시도가 너무 많습니다. 1분 후 다시 시도해주세요.' },
                { status: 429 }
            );
        }

        // Get inquiry
        const { data: inquiry, error } = await supabase
            .from('Inquiry')
            .select('passwordLast4')
            .eq('id', inquiryId)
            .single();

        if (error || !inquiry) {
            return NextResponse.json({ error: '문의를 찾을 수 없습니다.' }, { status: 404 });
        }

        // Verify PIN with timing-safe comparison
        if (!timingSafeCompare(pin, inquiry.passwordLast4 || '')) {
            return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Verify PIN error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

