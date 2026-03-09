import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// OTP를 임시 저장 (프로덕션에서는 Redis/DB 사용 권장)
// Vercel serverless에서는 메모리가 요청간 공유 안 되므로 Supabase에 저장
import { createClient } from '@supabase/supabase-js';

function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function getSolapiSignature(apiKey: string, apiSecret: string, date: string, salt: string) {
    const message = date + salt;
    return crypto.createHmac('sha256', apiSecret).update(message).digest('hex');
}

export async function POST(request: NextRequest) {
    try {
        const { phone } = await request.json();

        if (!phone) {
            return NextResponse.json({ error: '전화번호를 입력해주세요' }, { status: 400 });
        }

        // 번호 정리: 하이픈 제거
        const cleanPhone = phone.replace(/-/g, '');

        // OTP 생성
        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5분 후 만료

        // Supabase에 OTP 저장
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_KEY!
        );

        // otp_codes 테이블에 저장 (upsert)
        await supabaseAdmin.from('otp_codes').upsert({
            phone: cleanPhone,
            code: otp,
            expires_at: expiresAt,
            verified: false,
        }, { onConflict: 'phone' });

        // 솔라피 API로 SMS 발송
        const apiKey = process.env.SOLAPI_API_KEY!;
        const apiSecret = process.env.SOLAPI_API_SECRET!;
        const sender = process.env.SOLAPI_SENDER!;

        const date = new Date().toISOString();
        const salt = crypto.randomUUID();
        const signature = getSolapiSignature(apiKey, apiSecret, date, salt);

        const smsRes = await fetch('https://api.solapi.com/messages/v4/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`,
            },
            body: JSON.stringify({
                message: {
                    to: cleanPhone,
                    from: sender,
                    text: `[대대손손] 인증번호 [${otp}]를 입력해주세요.`,
                },
            }),
        });

        const smsData = await smsRes.json();

        if (!smsRes.ok) {
            console.error('Solapi error:', smsData);
            return NextResponse.json({ error: '인증번호 발송에 실패했습니다' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: '인증번호가 발송되었습니다' });
    } catch (error) {
        console.error('Send OTP error:', error);
        return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
    }
}
