import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { sendSlack, escapeSlack } from '@/lib/slack';

const supabase = getSupabaseServer();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facilityId, type, title, content, phone, isPrivate } = body;

        if (!title || !content || !phone) {
            return NextResponse.json({ error: '필수 항목 누락' }, { status: 400 });
        }


        const passwordLast4 = phone.replace(/\D/g, '').slice(-4);

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
        await sendSlack('inquiry', `💬 *새 댓글 문의!*\n• 시설: ${escapeSlack(facilityId || '일반')}\n• 문의 종류: ${escapeSlack(typeLabels[type] || type || '기타')}\n• 제목: ${escapeSlack(title)}\n• 내용: ${escapeSlack(content.slice(0, 100))}...\n• 연락처: ${escapeSlack(phone)}\n• 비밀글: ${isPrivate ? '예' : '아니오'}`);

        const { passwordLast4: _pin, phone: _ph, ...safeData } = data || {};
        return NextResponse.json(safeData);
    } catch (error) {
        console.error('Inquiry API error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
