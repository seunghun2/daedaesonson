import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken, verifyAdminToken, timingSafeCompare } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '0612';

// GET: 인증 상태 확인
export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get('admin_session');
    if (!(await verifyAdminToken(sessionCookie?.value))) {
        return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true });
}

// POST: 로그인
export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `admin-login:${ip}`, limit: 5, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json(
            { error: '너무 많은 로그인 시도가 감지되었습니다. 1분 후 다시 시도해주세요.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const { password } = body;

        if (!password || typeof password !== 'string') {
            return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
        }

        if (!timingSafeCompare(password, ADMIN_PASSWORD)) {
            return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        const signedToken = await createAdminToken();

        const response = NextResponse.json({ success: true });
        response.cookies.set('admin_session', signedToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7일
        });

        return response;
    } catch {
        return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 400 });
    }
}

// DELETE: 로그아웃
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin_session');
    return response;
}

