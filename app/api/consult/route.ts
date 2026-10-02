import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { sendSlack, sendSlackError, escapeSlack } from '@/lib/slack';
import { sendConsultNotification } from '@/lib/notification';
import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';

const supabase = getSupabaseServer();

// POST: 상담 신청
export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `consult-post:${ip}`, limit: 5, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json({ error: '너무 많은 요청입니다. 1분 후 다시 시도해주세요.' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { facilityId, facilityName, name, phone, preferredTime, question, message, consultMethod, userId } = body;

        if (!facilityId || !name || !phone) {
            return NextResponse.json({ error: '필수 정보를 입력해주세요.' }, { status: 400 });
        }

        const cleanPhone = String(phone).replace(/[^0-9]/g, '');
        if (!/^01[016789]\d{7,8}$/.test(cleanPhone)) {
            return NextResponse.json({ error: '올바른 휴대폰 번호를 입력해주세요.' }, { status: 400 });
        }

        const trimName = String(name).trim();
        if (trimName.length < 2 || trimName.length > 30) {
            return NextResponse.json({ error: '이름은 2~30자 이내로 입력해주세요.' }, { status: 400 });
        }

        if (message && String(message).length > 1000) {
            return NextResponse.json({ error: '메모는 1,000자 이내로 입력해주세요.' }, { status: 400 });
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

        // 회원 ID가 전달되었고, 프로필에 연락처가 비어있다면 자동 연동/업데이트
        if (userId) {
            try {
                await supabase
                    .from('profiles')
                    .update({ phone: cleanPhone })
                    .eq('id', userId)
                    .is('phone', null);
            } catch (pErr) {
                console.warn('Failed to backfill phone to profile:', pErr);
            }
        }

        // 통합 알림 발송 (고객 알림톡 + 관리자 Slack 듀얼 노티)
        sendConsultNotification({
            consultId: data.id,
            facilityName: facilityName || facilityId,
            customerName: name,
            customerPhone: phone,
            preferredTime,
            question,
            consultMethod,
            message,
        }).catch(err => console.error('Notification error:', err));

        return NextResponse.json({ success: true, consult: data });

    } catch (error) {
        console.error('Consult POST error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// GET: 모든 상담 조회 (어드민용)
export async function GET() {
    const authError = await requireAdmin();
    if (authError) return authError;

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
