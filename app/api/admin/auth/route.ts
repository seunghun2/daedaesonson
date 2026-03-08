import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PASSWORD = '0612';
const ADMIN_TOKEN = 'dds_admin_verified';

// POST: 로그인
export async function POST(request: NextRequest) {
    try {
        const { password } = await request.json();

        if (password !== ADMIN_PASSWORD) {
            return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }

        const response = NextResponse.json({ success: true });
        response.cookies.set('admin_session', ADMIN_TOKEN, {
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
