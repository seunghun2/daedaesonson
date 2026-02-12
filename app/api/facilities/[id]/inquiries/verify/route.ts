import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// 비밀번호 검증 (POST)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const body = await request.json();
        const { inquiryId, pin } = body;

        if (!inquiryId || !pin) {
            return NextResponse.json({ error: '필수 정보가 누락되었습니다.' }, { status: 400 });
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

        // Verify PIN
        if (pin !== inquiry.passwordLast4) {
            return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Verify PIN error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
