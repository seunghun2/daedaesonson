import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    try {
        const supabase = getSupabaseServer();

        // 🚀 head: true 를 사용하여 무거운 본문 전송 없이 DB 카운트만 고속 조회
        const [
            { count: totalFacilities },
            { count: membersCount },
            { count: consultsCount },
            { count: inquiriesCount },
            { count: reviewsCount },
            { count: correctionsCount },
            { count: partnershipCount },
            { data: categoryData },
            { data: recentFacilities }
        ] = await Promise.all([
            supabase.from('Facility').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('Consult').select('*', { count: 'exact', head: true }),
            supabase.from('Inquiry').select('*', { count: 'exact', head: true }),
            supabase.from('Review').select('*', { count: 'exact', head: true }),
            supabase.from('facility_corrections').select('*', { count: 'exact', head: true }),
            supabase.from('partnership_inquiries').select('*', { count: 'exact', head: true }),
            supabase.from('Facility').select('category'),
            supabase.from('Facility').select('id, name, category, rating, updatedAt').order('updatedAt', { ascending: false }).limit(5)
        ]);

        const categoryCounts: Record<string, number> = {};
        (categoryData || []).forEach((f: any) => {
            if (f.category) {
                categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
            }
        });

        return NextResponse.json({
            stats: {
                totalFacilities: totalFacilities || 0,
                membersCount: membersCount || 0,
                consultsCount: consultsCount || 0,
                inquiriesCount: inquiriesCount || 0,
                reviewsCount: reviewsCount || 0,
                correctionsCount: correctionsCount || 0,
                partnershipCount: partnershipCount || 0,
            },
            categoryCounts,
            recentFacilities: recentFacilities || [],
        }, {
            headers: {
                'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30'
            }
        });
    } catch (e: any) {
        console.error('Admin stats error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
