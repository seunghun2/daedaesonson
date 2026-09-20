import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { cookies } from 'next/headers';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { verifyAdminToken, timingSafeCompare } from '@/lib/adminAuth';

const supabase = getSupabaseServer();

// 문의 목록 조회 (GET)
export async function GET(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: facilityId } = await context.params;

    try {
        const { data, error } = await supabase
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

        // Mask private inquiry content and strip PII / credentials
        const maskedData = data?.map(({ phone, passwordLast4, ...item }) => ({
            ...item,
            content: item.isPrivate ? '비밀글입니다.' : item.content,
            title: item.isPrivate ? '비밀 문의' : item.title,
            replies: item.isPrivate ? [] : (item.replies || []),
        }));

        return NextResponse.json({ inquiries: maskedData });


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

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `inquiry-post:${ip}:${facilityId}`, limit: 5, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json({ error: '너무 많은 문의를 등록했습니다. 1분 후 다시 시도해주세요.' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { type, title, content, phone, isPrivate = true } = body;

        // Validation
        if (!title?.trim() || !content?.trim() || !phone?.trim()) {
            return NextResponse.json({ error: '모든 항목을 입력해주세요.' }, { status: 400 });
        }

        if (String(title).trim().length < 2 || String(title).length > 100) {
            return NextResponse.json({ error: '제목은 2자 이상 100자 이하로 입력해주세요.' }, { status: 400 });
        }

        if (String(content).trim().length < 5 || String(content).length > 2000) {
            return NextResponse.json({ error: '내용은 5자 이상 2,000자 이하로 입력해주세요.' }, { status: 400 });
        }

        // 전화번호 형식 검증 및 뒷자리 4자리 추출
        const phoneDigits = String(phone).replace(/\D/g, '');
        if (!/^01[016789]\d{7,8}$/.test(phoneDigits)) {
            return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해주세요.' }, { status: 400 });
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
        const { inquiryId, pin } = body;
        const cookieStore = await cookies();
        const isAdmin = await verifyAdminToken(cookieStore.get('admin_session')?.value);


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
            if (!pin || !timingSafeCompare(pin, inquiry.passwordLast4 || '')) {
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
