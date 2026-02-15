import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 모든 리뷰 조회 (어드민용)
export async function GET() {
    try {
        const { data: reviews, error } = await supabase
            .from('Review')
            .select('*, replies:Reply(*)')
            .order('createdAt', { ascending: false })
            .limit(100);

        if (error) {
            console.error('Fetch reviews error:', error);
            return NextResponse.json({ error: '리뷰 조회 실패' }, { status: 500 });
        }

        // 리뷰에 있는 시설 ID들 추출
        const facilityIds = [...new Set((reviews || []).map(r => r.facilityId))];

        // Supabase에서 시설명 조회
        let facilityNameMap = new Map<string, string>();
        if (facilityIds.length > 0) {
            const { data: facilities } = await supabase
                .from('Facility')
                .select('id, name')
                .in('id', facilityIds);

            if (facilities) {
                facilityNameMap = new Map(facilities.map(f => [f.id, f.name]));
            }
        }

        // 시설명 추가 + password 제거
        const enrichedReviews = (reviews || []).map(r => {
            const { password, ...safeReview } = r;
            return {
                ...safeReview,
                facilityName: facilityNameMap.get(r.facilityId) || '시설',
            };
        });

        return NextResponse.json({ reviews: enrichedReviews }, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
            }
        });

    } catch (error) {
        console.error('Admin reviews GET error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// DELETE: 리뷰 삭제 (어드민)
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { reviewId } = body;

        if (!reviewId) {
            return NextResponse.json({ error: '리뷰 ID가 필요합니다.' }, { status: 400 });
        }

        // Get facilityId before deleting
        const { data: review } = await supabase
            .from('Review')
            .select('facilityId')
            .eq('id', reviewId)
            .single();

        // Delete review
        const { error } = await supabase
            .from('Review')
            .delete()
            .eq('id', reviewId);

        if (error) {
            console.error('Delete review error:', error);
            return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
        }

        // Update facility reviewCount
        if (review) {
            const { data: facility } = await supabase
                .from('Facility')
                .select('reviewCount')
                .eq('id', review.facilityId)
                .single();

            if (facility && facility.reviewCount > 0) {
                await supabase
                    .from('Facility')
                    .update({ reviewCount: facility.reviewCount - 1 })
                    .eq('id', review.facilityId);
            }
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin reviews DELETE error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
