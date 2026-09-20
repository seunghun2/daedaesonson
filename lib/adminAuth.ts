import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 7; // 7일 (유효기간)

function getAdminSecret(): string {
    const secret = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_KEY;
    if (!secret) {
        throw new Error('ADMIN_SESSION_SECRET 또는 SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.');
    }
    return secret;
}

const encoder = new TextEncoder();

async function getHmacKey(secret: string) {
    return await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign', 'verify']
    );
}

/**
 * 관리자 서명 세션 토큰 생성 (Web Crypto HMAC-SHA256)
 * 포맷: `<timestamp>.<hmacSignature>`
 */
export async function createAdminToken(): Promise<string> {
    const timestamp = Date.now().toString();
    const key = await getHmacKey(getAdminSecret());
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(timestamp));
    const hexSig = Array.from(new Uint8Array(signature))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    return `${timestamp}.${hexSig}`;
}

/**
 * 타이밍 공격 방지 문자열 비교 헬퍼 (Edge & Node 호환)
 */
export function timingSafeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
}

/**
 * 관리자 세션 토큰의 유효성, 위변조 여부, 만료 시간(7일) 검증
 */
export async function verifyAdminToken(token: string | undefined | null): Promise<boolean> {
    if (!token) return false;

    const parts = token.split('.');
    if (parts.length !== 2) return false;

    const [timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    if (isNaN(timestamp)) return false;

    // 만료 시간 (7일) 및 미래 시간 조작 검증
    const now = Date.now();
    if (now - timestamp > SESSION_MAX_AGE_MS || timestamp > now + 60000) {
        return false;
    }

    try {
        const key = await getHmacKey(getAdminSecret());
        const expectedSig = await crypto.subtle.sign('HMAC', key, encoder.encode(timestampStr));
        const hexSig = Array.from(new Uint8Array(expectedSig))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
        return timingSafeCompare(signature, hexSig);
    } catch {
        return false;
    }
}

/**
 * 관리자 인증 검증 헬퍼
 * - admin_session 쿠키가 유효한지 확인
 * - 인증 실패 시 401 응답 반환, 성공 시 null 반환
 */
export async function requireAdmin(): Promise<NextResponse | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || !(await verifyAdminToken(session.value))) {
        return NextResponse.json(
            { error: '관리자 인증이 필요합니다.' },
            { status: 401 }
        );
    }

    return null;
}


