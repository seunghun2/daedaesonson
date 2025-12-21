import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// 문의 목록 조회 (GET)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: facilityId } = await context.params;

    try {
        const { data: inquiries, error } = await supabase
            .from('Inquiry')
            .select(`
                *,
                replies:InquiryReply(*)
            `)
            .eq('facilityId', facilityId)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Fetch inquiries error:', error);
            return NextResponse.json({ error: '문의 조회 실패' }, { status: 500 });
        }

        // 민감 정보(전화번호 전체, 비밀번호) 숨기기
        const safeInquiries = inquiries?.map(inq => ({
            id: inq.id,
            facilityId: inq.facilityId,
            type: inq.type || 'other',
            title: inq.title,
            content: inq.content,
            isPrivate: inq.isPrivate,
            createdAt: inq.createdAt,
            replies: inq.replies?.map((r: any) => ({
                id: r.id,
                author: r.author,
                content: r.content,
                createdAt: r.createdAt
            })) || []
            // phone, passwordLast4 제외
        })) || [];

        return NextResponse.json({ inquiries: safeInquiries });

    } catch (error) {
        console.error('Inquiries GET error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// 문의 등록 (POST)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: facilityId } = await context.params;

    try {
        const body = await request.json();
        const { type, title, content, phone, isPrivate = true } = body;

        // Validation
        if (!title?.trim() || !content?.trim() || !phone?.trim()) {
            return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
        }

        // 전화번호에서 뒷자리 4자리 추출
        const phoneDigits = phone.replace(/\D/g, '');
        if (phoneDigits.length < 10) {
            return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' }, { status: 400 });
        }
        const passwordLast4 = phoneDigits.slice(-4);

        // Insert
        const { data: newInquiry, error } = await supabase
            .from('Inquiry')
            .insert({
                facilityId,
                type: type || 'other',
                title,
                content,
                phone,
                passwordLast4,
                isPrivate,
                createdAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Insert inquiry error:', error);
            return NextResponse.json({ error: '문의 등록 실패' }, { status: 500 });
        }

        // Return without sensitive data
        return NextResponse.json({
            success: true,
            inquiry: {
                id: newInquiry.id,
                facilityId: newInquiry.facilityId,
                type: newInquiry.type || 'other',
                title: newInquiry.title,
                content: newInquiry.content,
                isPrivate: newInquiry.isPrivate,
                createdAt: newInquiry.createdAt,
                replies: []
            }
        });

    } catch (error) {
        console.error('Inquiry POST error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// 문의 삭제 (DELETE)
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: facilityId } = await context.params;

    try {
        const body = await request.json();
        const { inquiryId, pin, isAdmin } = body;

        if (!inquiryId) {
            return NextResponse.json({ error: '문의 ID가 필요합니다.' }, { status: 400 });
        }

        // Get inquiry
        const { data: inquiry, error: fetchError } = await supabase
            .from('Inquiry')
            .select('*')
            .eq('id', inquiryId)
            .single();

        if (fetchError || !inquiry) {
            return NextResponse.json({ error: '문의를 찾을 수 없습니다.' }, { status: 404 });
        }

        // Verify permission
        if (!isAdmin) {
            if (!pin || pin !== inquiry.passwordLast4) {
                return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
            }
        }

        // Delete replies first
        await supabase.from('InquiryReply').delete().eq('inquiryId', inquiryId);

        // Delete inquiry
        const { error: deleteError } = await supabase
            .from('Inquiry')
            .delete()
            .eq('id', inquiryId);

        if (deleteError) {
            return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Inquiry DELETE error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
