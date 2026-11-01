import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';

const ADMIN_IPS = ['14.38.63.241', '127.0.0.1', '::1', '117.111.6.111', '117.111.5.105', '210.121.187.54'];

function isAdminOrLocalIp(ip: string): boolean {
    if (!ip || ip === 'unknown') return false;
    if (ADMIN_IPS.includes(ip)) return true;
    if (ip.startsWith('117.111.')) return true;
    return false;
}

export async function POST(request: Request) {
    try {
        const { path, referer, userAgent } = await request.json();

        // IP 추출 (Vercel 환경)
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded?.split(',')[0]?.trim() ||
                   request.headers.get('x-real-ip') ||
                   'unknown';

        // 내부 관리자/로컬 IP 제외 (허수 통계 유입 원천 차단)
        if (isAdminOrLocalIp(ip)) {
            return NextResponse.json({ success: true, filtered: 'admin_ip' });
        }

        // IP 기반 Rate Limit (분당 30회)
        const rateCheck = rateLimit({ key: `access-log:${ip}`, limit: 30, windowMs: 60000 });
        if (!rateCheck.success) {
            return NextResponse.json({ success: true, filtered: 'rate_limited' });
        }

        // 봇/크롤러 필터링
        const ua = userAgent || request.headers.get('user-agent') || '';
        if (isBot(ua)) {
            return NextResponse.json({ success: true, filtered: 'bot' });
        }

        // 정적 리소스 및 어드민 필터링
        if (!path || path.startsWith('/admin') || isStaticResource(path)) {
            return NextResponse.json({ success: true, filtered: 'static' });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
        const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
            return NextResponse.json({ success: false, error: 'no config' });
        }

        await fetch(`${supabaseUrl}/rest/v1/access_logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                ip_address: ip,
                path: (path || '/').substring(0, 500),
                user_agent: ua.substring(0, 500),
                referer: (referer || '').substring(0, 1000),
            }),
        }).catch(err => console.error('[AccessLog] Write error:', err));

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('[AccessLog] API error:', error);
        return NextResponse.json({ success: true });
    }
}

function isBot(ua: string): boolean {
    const botPatterns = [
        /bot/i, /crawler/i, /spider/i, /slurp/i, /mediapartners/i,
        /googlebot/i, /bingbot/i, /yandex/i, /baidu/i, /duckduck/i,
        /semrush/i, /ahrefs/i, /mj12bot/i, /dotbot/i, /petalbot/i,
        /headless/i, /phantomjs/i, /lighthouse/i, /chrome-lighthouse/i,
        /vercel/i, /uptimerobot/i, /facebookexternalhit/i, /kakaotalk-scrap/i, /yeti/i,
    ];
    return botPatterns.some(p => p.test(ua));
}

function isStaticResource(path: string): boolean {
    const cleanPath = path.split('?')[0];
    const staticExts = ['.js', '.css', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.webp', '.map'];
    const staticPaths = ['/favicon.ico', '/robots.txt', '/sitemap.xml', '/_next/', '/.well-known/'];

    return staticExts.some(ext => cleanPath.endsWith(ext)) ||
           staticPaths.some(sp => cleanPath.startsWith(sp));
}
