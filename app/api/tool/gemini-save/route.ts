import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';

// POST: Gemini 결과 저장 — Vercel 서버리스 환경에서 파일 쓰기 불가 (EROFS)
// TODO: Supabase DB 기반으로 전환 필요
export async function POST() {
    const authError = await requireAdmin();
    if (authError) return authError;

    return NextResponse.json(
        { success: false, error: '이 API는 현재 비활성화되어 있습니다. Supabase DB를 통해 결과를 저장해주세요.' },
        { status: 501 }
    );
}
