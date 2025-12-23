import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    'https://jbydmhfuqnpukfutvrgs.supabase.co',
    process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpieWRtaGZ1cW5wdWtmdXR2cmdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM3NTE5NDgsImV4cCI6MjA0OTMyNzk0OH0.D1wdKkJDezXqoTnb_Uyv9kWxCo2CQ3VFqrA-DPBJ92o'
);

// 시설 ID-이름 맵핑만 반환 (경량)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const idsParam = searchParams.get('ids');

        let query = supabase.from('Facility').select('id, name');

        // 특정 ID들만 조회 (있는 경우)
        if (idsParam) {
            const ids = idsParam.split(',').filter(Boolean);
            if (ids.length > 0) {
                query = query.in('id', ids);
            }
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: '조회 실패' }, { status: 500 });
        }

        // { id: name } 형태의 맵 반환
        const nameMap: Record<string, string> = {};
        data?.forEach(f => {
            nameMap[f.id] = f.name;
        });

        return NextResponse.json({ nameMap });
    } catch (error) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
