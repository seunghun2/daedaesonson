import { NextResponse } from 'next/server';

export async function GET() {
    return NextResponse.json({
        NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        SUPABASE_SERVICE_KEY: !!process.env.SUPABASE_SERVICE_KEY,
        KAKAO_CLIENT_SECRET: !!process.env.KAKAO_CLIENT_SECRET,
        SOLAPI_API_KEY: !!process.env.SOLAPI_API_KEY,
        GEMINI_API_KEY: !!process.env.GEMINI_API_KEY,
        // 값의 처음 몇글자만 (디버그용)
        URL_PREFIX: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 20) || 'MISSING',
        SERVICE_KEY_PREFIX: process.env.SUPABASE_SERVICE_KEY?.slice(0, 10) || 'MISSING',
    });
}
