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

    // 📊 접속 로그 수집 (비동기, 논블로킹)
    // API 경로, 정적 파일, _next 등은 제외
    if (shouldLogAccess(pathname)) {
        const logUrl = new URL('/api/access-log', request.url);
        
        fetch(logUrl.toString(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                path: pathname,
                referer: request.headers.get('referer') || '',
                userAgent: request.headers.get('user-agent') || '',
            }),
        }).catch(() => {}); // fire-and-forget: 로깅 실패해도 사용자 경험에 영향 없음
    }

    return NextResponse.next();
}

function shouldLogAccess(pathname: string): boolean {
    // API, 정적 파일, _next, 관리자 페이지는 제외
    if (pathname.startsWith('/api/')) return false;
    if (pathname.startsWith('/_next/')) return false;
    if (pathname.startsWith('/admin')) return false;
    if (pathname === '/favicon.ico') return false;
    if (pathname === '/robots.txt') return false;
    if (pathname === '/sitemap.xml') return false;
    if (pathname.includes('.')) return false; // 파일 확장자가 있는 경우 제외
    
    return true;
}

export const config = {
    matcher: [
        // 관리자 API 보호
        '/api/admin/:path*',
        // 접속 로그 수집 대상 (페이지 경로들)
        '/',
        '/facility/:path*',
        '/search/:path*',
        '/list/:path*',
        '/region/:path*',
        '/blog/:path*',
        '/about',
        '/faq',
        '/contact',
        '/glossary/:path*',
        '/history/:path*',
        '/menu/:path*',
    ],
};
