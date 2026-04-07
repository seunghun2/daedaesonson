import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { path, referer, userAgent } = await request.json();

        // IP 추출 (Vercel 환경)
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

        // 봇/크롤러 필터링
        const ua = userAgent || request.headers.get('user-agent') || '';
        if (isBot(ua)) {
            return NextResponse.json({ success: true, filtered: 'bot' });
        }

        // 정적 리소스 필터링
        if (isStaticResource(path)) {
            return NextResponse.json({ success: true, filtered: 'static' });
        }

        // Supabase에 저장 (fire-and-forget 패턴)
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || '';

        if (!supabaseKey) {
            return NextResponse.json({ success: false, error: 'no key' });
        }

        // Edge-optimized: fetch 직접 호출 (클라이언트 초기화 비용 절약)
        fetch(`${supabaseUrl}/rest/v1/access_logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                ip_address: ip,
                path: path || '/',
                user_agent: ua.substring(0, 500), // 최대 500자
                referer: (referer || '').substring(0, 1000),
            }),
        }).catch(err => console.error('[AccessLog] Write error:', err));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[AccessLog] API error:', error);
        return NextResponse.json({ success: true }); // 에러여도 200 반환 (UX 영향 X)
    }
}

function isBot(ua: string): boolean {
    const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /slurp/i, /mediapartners/i,
        /googlebot/i, /bingbot/i, /yandex/i, /baidu/i, /duckduck/i,
        /semrush/i, /ahrefs/i, /mj12bot/i, /dotbot/i, /petalbot/i,
        /headless/i, /phantomjs/i, /lighthouse/i, /chrome-lighthouse/i,
    ];
    return botPatterns.some(p => p.test(ua));
}

function isStaticResource(path: string): boolean {
    const staticExts = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.webp', '.map'];
    const staticPaths = ['/favicon.ico', '/robots.txt', '/sitemap.xml', '/_next/', '/.well-known/'];
    
    return staticExts.some(ext => path.endsWith(ext)) || 
           staticPaths.some(sp => path.startsWith(sp));
}
