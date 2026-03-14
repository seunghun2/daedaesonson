import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 상담 통계 집계
export async function GET() {
    try {
        // 모든 세션 가져오기
        const { data: sessions, error } = await supabase
            .from('ChatSession')
            .select('id, facility_id, customer_phone, status, tags, messages, created_at');

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        const all = sessions || [];

        // 상태별 건수
        const statusCounts = {
            total: all.length,
            new: all.filter(s => s.status === 'new').length,
            reviewed: all.filter(s => s.status === 'reviewed').length,
            contacted: all.filter(s => s.status === 'contacted').length,
        };

        // 일별 상담 건수 (최근 14일)
        const dailyCounts: Record<string, number> = {};
        const now = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const key = d.toISOString().split('T')[0];
            dailyCounts[key] = 0;
        }
        all.forEach(s => {
            const day = s.created_at?.split('T')[0];
            if (day && dailyCounts[day] !== undefined) {
                dailyCounts[day]++;
            }
        });

        // 인기 시설 TOP 10
        const facilityMap: Record<string, number> = {};
        all.forEach(s => {
            if (s.facility_id) {
                facilityMap[s.facility_id] = (facilityMap[s.facility_id] || 0) + 1;
            }
        });
        const topFacilities = Object.entries(facilityMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([id, count]) => ({ id, count }));

        // 고객 수 (전화번호 기준)
        const uniqueCustomers = new Set(all.filter(s => s.customer_phone).map(s => s.customer_phone)).size;

        // 태그별 건수
        const tagCounts: Record<string, number> = {};
        all.forEach(s => {
            if (s.tags?.length) {
                s.tags.forEach((t: string) => {
                    tagCounts[t] = (tagCounts[t] || 0) + 1;
                });
            }
        });

        // 평균 메시지 수
        const totalMessages = all.reduce((sum, s) => sum + (s.messages?.length || 0), 0);
        const avgMessages = all.length > 0 ? Math.round(totalMessages / all.length) : 0;

        return NextResponse.json({
            statusCounts,
            dailyCounts,
            topFacilities,
            uniqueCustomers,
            tagCounts,
            avgMessages,
        });
    } catch {
        return NextResponse.json({ error: '통계 조회 실패' }, { status: 500 });
    }
}
