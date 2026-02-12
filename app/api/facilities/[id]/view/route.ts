import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// 조회수 증가 (POST)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // 현재 조회수 가져오기
        const { data: facility, error: fetchError } = await supabase
            .from('Facility')
            .select('viewCount')
            .eq('id', id)
            .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Fetch error:', fetchError);
        }

        // 조회수 계산 (없으면 ID 기반 시작값)
        let currentCount = facility?.viewCount || 0;
        if (currentCount === 0) {
            const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            currentCount = 50 + (hash * 17) % 450;
        }
        const newCount = currentCount + 1;

        // Supabase에 업데이트
        const { error: updateError } = await supabase
            .from('Facility')
            .update({ viewCount: newCount })
            .eq('id', id);

        if (updateError) {
            console.error('Update error:', updateError);
            // 업데이트 실패해도 카운트는 반환
        }

        return NextResponse.json({
            viewCount: newCount,
            success: true
        });
    } catch (error) {
        console.error('View count error:', error);
        // 에러 시에도 기본값 반환
        const { id } = await params;
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const fallbackCount = 50 + (hash * 17) % 450;
        return NextResponse.json({ viewCount: fallbackCount, success: false });
    }
}

// 조회수 조회 (GET)
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: facility, error } = await supabase
            .from('Facility')
            .select('viewCount')
            .eq('id', id)
            .single();

        let viewCount = facility?.viewCount || 0;
        if (viewCount === 0) {
            const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            viewCount = 50 + (hash * 17) % 450;
        }

        return NextResponse.json({ viewCount });
    } catch (error) {
        const { id } = await params;
        const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        const viewCount = 50 + (hash * 17) % 450;
        return NextResponse.json({ viewCount });
    }
}
