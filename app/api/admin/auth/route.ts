import { NextRequest, NextResponse } from 'next/server';
import { createAdminToken, verifyAdminToken, timingSafeCompare } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';

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

    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
        console.error('CRITICAL: ADMIN_PASSWORD environment variable is not configured.');
        return NextResponse.json(
            { error: '서버 인증 구성 오류가 발생했습니다. 관리자에게 문의하세요.' },
            { status: 500 }
        );
    }

    let password: string;
    try {
        const body = await request.json();
        password = body?.password;
    } catch {
        return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    if (!password || typeof password !== 'string') {
        return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
    }

    if (!timingSafeCompare(password, adminPassword)) {
        return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
    }

    try {
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
    } catch (error) {
        console.error('Admin token creation error:', error);
        return NextResponse.json(
            { error: '인증 세션 생성에 실패했습니다.' },
            { status: 500 }
        );
    }
}

// DELETE: 로그아웃
export async function DELETE() {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('admin_session');
    return response;
}

