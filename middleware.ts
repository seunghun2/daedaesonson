import { NextRequest, NextResponse } from 'next/server';

const ADMIN_TOKEN = 'dds_admin_verified';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // /api/admin/auth는 인증 없이 접근 가능 (로그인 API)
    if (pathname === '/api/admin/auth') {
        return NextResponse.next();
    }

    // /api/admin/* 경로 보호
    if (pathname.startsWith('/api/admin')) {
        const sessionCookie = request.cookies.get('admin_session');

        if (!sessionCookie || sessionCookie.value !== ADMIN_TOKEN) {
            return NextResponse.json(
                { error: '인증이 필요합니다. 관리자 로그인을 해주세요.' },
                { status: 401 }
            );
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/api/admin/:path*'],
};
