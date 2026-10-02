import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { sendSlack, escapeSlack } from '@/lib/slack';

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `conversion:${ip}`, limit: 30, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json({ ok: false }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { type, facilityId, facilityName } = body;

        if (!type || !facilityId) {
            return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
        }

        console.log(`[CONVERSION] type=${type}, facilityId=${facilityId}, name=${facilityName || 'unknown'}, ip=${ip}`);

        // 고가치 전환(전화 클릭 등) 발생 시 Slack 알림 (선택적)
        if (type === 'call_click') {
            sendSlack(
                'consult',
                `📞 *시설 전화 문의 클릭 발생*\n• 시설: *${escapeSlack(facilityName || facilityId)}* (ID: ${facilityId})\n• IP: ${ip}\n• 시간: ${new Date().toLocaleTimeString('ko-KR', { timeZone: 'Asia/Seoul' })}`
            ).catch(() => {});
        }

        return NextResponse.json({ ok: true });
    } catch (e) {
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
