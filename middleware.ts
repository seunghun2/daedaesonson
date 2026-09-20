import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken } from '@/lib/adminAuth';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // /api/admin/auth는 로그인 엔드포인트이므로 통과
    if (pathname === '/api/admin/auth') {
        return NextResponse.next();
    }

    const sessionCookie = request.cookies.get('admin_session');
    if (!(await verifyAdminToken(sessionCookie?.value))) {
        return NextResponse.json(
            { error: '인증이 필요합니다. 관리자 로그인을 해주세요.' },
            { status: 401 }
        );
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/api/admin/:path*',
        '/api/upload',
        '/api/crawl',
        '/api/analyze-pdf',
        '/api/save-pricing',
        '/api/analyze-pricing-image',
    ],
};

