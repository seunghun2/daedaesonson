import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/adminAuth';

const supabase = getSupabaseServer();

// GET: 모든 리뷰 조회 (어드민용)
export async function GET() {
    const authError = await requireAdmin();
    if (authError) return authError;

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
                replies: (r.replies || []).map(({ password: replyPw, ...rep }: any) => rep),
            };
        });


        return NextResponse.json({ reviews: enrichedReviews }, {
            headers: {
                'Cache-Control': 'private, no-store, no-cache, must-revalidate'
            }
        });

    } catch (error) {
        console.error('Admin reviews GET error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// DELETE: 리뷰 삭제 (어드민)
export async function DELETE(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

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

        // Update facility reviewCount and rating accurately
        if (review?.facilityId) {
            const { data: remainingReviews } = await supabase
                .from('Review')
                .select('rating')
                .eq('facilityId', review.facilityId);

            const count = remainingReviews?.length || 0;
            const avgRating = count > 0
                ? Number((remainingReviews!.reduce((acc, r) => acc + (r.rating || 0), 0) / count).toFixed(1))
                : 0;

            await supabase
                .from('Facility')
                .update({ reviewCount: count, rating: avgRating })
                .eq('id', review.facilityId);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin reviews DELETE error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
