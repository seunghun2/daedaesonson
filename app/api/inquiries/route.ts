import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { sendSlack, escapeSlack } from '@/lib/slack';
import { rateLimit } from '@/lib/rateLimit';

const supabase = getSupabaseServer();

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `inquiries-post:${ip}`, limit: 5, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json({ error: '너무 많은 문의를 등록했습니다. 1분 후 다시 시도해주세요.' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { facilityId, type, title, content, phone, isPrivate } = body;

        if (!title?.trim() || !content?.trim() || !phone?.trim()) {
            return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
        }

        if (String(title).trim().length < 2 || String(title).length > 100) {
            return NextResponse.json({ error: '제목은 2자 이상 100자 이하로 입력해주세요.' }, { status: 400 });
        }

        if (String(content).trim().length < 5 || String(content).length > 2000) {
            return NextResponse.json({ error: '내용은 5자 이상 2,000자 이하로 입력해주세요.' }, { status: 400 });
        }

        const phoneDigits = String(phone).replace(/\D/g, '');
        if (!/^01[016789]\d{7,8}$/.test(phoneDigits)) {
            return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해주세요.' }, { status: 400 });
        }
        const passwordLast4 = phoneDigits.slice(-4);

        const { data, error } = await supabase
            .from('Inquiry')
            .insert({
                facilityId: facilityId || 'general',
                type: type || 'other',
                title,
                content,
                phone,
                passwordLast4,
                isPrivate: isPrivate ?? true,
                createdAt: new Date().toISOString(),
            })
            .select()
            .single();

        if (error) {
            console.error('Inquiry insert error:', error);
            return NextResponse.json({ error: '문의 등록 중 오류가 발생했습니다.' }, { status: 500 });
        }

        // Slack 알림 (인젝션 방지 escapeSlack 적용)
        const typeLabels: Record<string, string> = { price: '가격 문의', location: '위치/교통', reservation: '예약/절차', facility: '시설 이용', other: '기타' };
        const facilityLabel = (!facilityId || facilityId === 'general') ? '일반' : facilityId;
        await sendSlack('inquiry', `💬 *새 댓글 문의!*\n• 시설: ${escapeSlack(facilityLabel)}\n• 문의 종류: ${escapeSlack(typeLabels[type] || type || '기타')}\n• 제목: ${escapeSlack(title)}\n• 내용: ${escapeSlack(content.slice(0, 100))}...\n• 연락처: ${escapeSlack(phone)}\n• 비밀글: ${isPrivate ? '예' : '아니오'}`);

        const { passwordLast4: _pin, phone: _ph, ...safeData } = data || {};
        return NextResponse.json(safeData);
    } catch (error) {
        console.error('Inquiry API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
