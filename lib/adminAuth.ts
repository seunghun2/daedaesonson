import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const ADMIN_TOKEN = 'dds_admin_verified';

/**
 * 관리자 인증 검증 헬퍼
 * - admin_session 쿠키가 유효한지 확인
 * - 인증 실패 시 401 응답 반환, 성공 시 null 반환
 *
 * @example
 * const authError = await requireAdmin();
 * if (authError) return authError;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    if (!session || session.value !== ADMIN_TOKEN) {
        return NextResponse.json(
            { error: '관리자 인증이 필요합니다.' },
            { status: 401 }
        );
    }

    return null;
}
