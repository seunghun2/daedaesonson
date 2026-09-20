import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSlack, sendSlackError, escapeSlack } from '@/lib/slack';
import { rateLimit } from '@/lib/rateLimit';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
    );
}

export async function POST(request: Request) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `recommendation-post:${ip}`, limit: 5, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json({ error: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { region, facilityType, budget, phone, message } = body;

        // 필수값 검증
        if (!region || !facilityType || !phone) {
            return NextResponse.json(
                { error: '필수 항목을 입력해주세요.' },
                { status: 400 }
            );
        }

        // 전화번호 형식 검증
        const phoneClean = String(phone || '').replace(/[^0-9]/g, '');
        if (!/^01[016789]\d{7,8}$/.test(phoneClean)) {
            return NextResponse.json(
                { error: '올바른 휴대폰 번호를 입력해주세요.' },
                { status: 400 }
            );
        }

        if (region && String(region).length > 50) {
            return NextResponse.json({ error: '지역명이 너무 깁니다.' }, { status: 400 });
        }

        if (message && String(message).length > 1000) {
            return NextResponse.json({ error: '문의 사항은 1,000자 이내로 입력해주세요.' }, { status: 400 });
        }

        // Supabase 저장
        const { data, error } = await getSupabase()
            .from('recommendation_requests')
            .insert({
                region,
                facility_type: facilityType,
                budget: budget || null,
                phone: phoneClean,
                message: message || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            await sendSlackError('recommendation', error);
            return NextResponse.json(
                { error: '저장 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // Slack 알림 (인젝션 방지 escapeSlack 적용)
        await sendSlack('recommend', `🎯 *새 맞춤 추천 요청!*\n• 희망 지역: ${escapeSlack(region)}\n• 시설 유형: ${escapeSlack(facilityType)}\n• 예산 범위: ${escapeSlack(budget || '미선택')}\n• 연락처: ${escapeSlack(phoneClean)}\n• 궁금하신 사항: ${escapeSlack(message || '없음')}\n• ID: #${data.id}`);

        return NextResponse.json({ success: true, id: data.id });
    } catch (err) {
        console.error('Recommendation API error:', err);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
