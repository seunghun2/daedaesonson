import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Slack webhook (optional)
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;

export async function POST(request: Request) {
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
        const phoneClean = phone.replace(/[^0-9]/g, '');
        if (phoneClean.length < 10 || phoneClean.length > 11) {
            return NextResponse.json(
                { error: '올바른 전화번호를 입력해주세요.' },
                { status: 400 }
            );
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
            return NextResponse.json(
                { error: '저장 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // Slack 알림 (webhook 설정 시)
        if (SLACK_WEBHOOK) {
            try {
                await fetch(SLACK_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: `🔔 *새 맞춤 추천 요청!*\n• 지역: ${region}\n• 유형: ${facilityType}\n• 예산: ${budget || '미입력'}\n• 연락처: ${phoneClean}\n• 메모: ${message || '없음'}\n• ID: #${data.id}`,
                    }),
                });
            } catch (e) {
                console.error('Slack notification failed:', e);
            }
        }

        return NextResponse.json({ success: true, id: data.id });
    } catch (err) {
        console.error('Recommendation API error:', err);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
