import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { sendSlack, sendSlackError } from '@/lib/slack';

const supabase = getSupabaseServer();

// POST: 상담 신청
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facilityId, facilityName, name, phone, preferredTime, question, message, consultMethod } = body;

        if (!facilityId || !name || !phone) {
            return NextResponse.json({ error: '필수 정보를 입력해주세요.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('Consult')
            .insert({
                facilityId,
                facilityName,
                name,
                phone,
                preferredTime: preferredTime || null,
                question: question || 'price',
                message: message || null,
                consultMethod: consultMethod || 'phone',
                status: 'pending',
                createdAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Insert consult error:', error);
            await sendSlackError('consult', error);
            return NextResponse.json({ error: '상담 신청 실패' }, { status: 500 });
        }

        // Slack 알림 (비동기 전송으로 폼 응답 지연 방지)
        const methodLabel = consultMethod === 'phone' ? '전화 상담' : consultMethod === 'field' ? '방문 상담' : consultMethod || '전화 상담';
        sendSlack('consult', `📞 *새 시설 상담 신청!*\n• 시설: ${facilityName || facilityId}\n• 이름: ${name}\n• 연락처: ${phone}\n• 연락 시간: ${preferredTime || '시간 무관'}\n• 문의 사항: ${question || '가격'}\n• 상담 방법: ${methodLabel}\n• 메시지: ${message || '없음'}\n• ID: #${data.id}`).catch(err => console.error('Slack notify error:', err));

        return NextResponse.json({ success: true, consult: data });

    } catch (error) {
        console.error('Consult POST error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// GET: 모든 상담 조회 (어드민용)
export async function GET() {
    try {
        const { data: consults, error } = await supabase
            .from('Consult')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) {
            return NextResponse.json({ error: '조회 실패' }, { status: 500 });
        }

        return NextResponse.json({ consults: consults || [] });
    } catch (error) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
