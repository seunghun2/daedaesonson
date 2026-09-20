import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    const sessionCookie = request.cookies.get('kakao_session_transient');
    if (!sessionCookie) {
        return NextResponse.json({ session: null });
    }

    const encoded = sessionCookie.value;
    try {
        const decoded = Buffer.from(encoded, 'base64').toString('utf-8');
        const tokens = JSON.parse(decoded);
        
        const res = NextResponse.json({ session: tokens });
        // Clean up the transient cookie
        res.cookies.delete('kakao_session_transient');
        return res;
    } catch (e) {
        return NextResponse.json({ session: null }, { status: 400 });
    }
}
