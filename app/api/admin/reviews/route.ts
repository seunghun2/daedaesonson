import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// 전체 리뷰 조회 (GET)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        // Get total count
        const { count } = await supabase
            .from('Review')
            .select('*', { count: 'exact', head: true });

        // Get reviews with facility info
        const { data: reviews, error } = await supabase
            .from('Review')
            .select(`
                *,
                facility:Facility!inner(id, name)
            `)
            .order('createdAt', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Fetch reviews error:', error);
            return NextResponse.json({ error: '리뷰 조회 실패' }, { status: 500 });
        }

        // Format for admin view (hide password)
        const formattedReviews = reviews?.map(r => ({
            id: r.id,
            facilityId: r.facilityId,
            facilityName: r.facility?.name || '알 수 없음',
            author: r.author,
            content: r.content,
            rating: r.rating,
            likes: r.likes || 0,
            photos: r.photos || [],
            createdAt: r.createdAt,
            date: r.createdAt ? new Date(r.createdAt).toISOString().split('T')[0] : ''
        })) || [];

        return NextResponse.json({
            reviews: formattedReviews,
            total: count || 0,
            page,
            totalPages: Math.ceil((count || 0) / limit)
        });

    } catch (error) {
        console.error('Admin reviews error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// 리뷰 삭제 (DELETE) - 어드민 전용
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { reviewId } = body;

        if (!reviewId) {
            return NextResponse.json({ error: '리뷰 ID가 필요합니다.' }, { status: 400 });
        }

        // Get review to find facilityId
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
            console.error('Delete error:', error);
            return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
        }

        // Update facility reviewCount
        if (review?.facilityId) {
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
        console.error('Delete review error:', error);
        return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
    }
}

// 리뷰 수정 (PATCH) - 어드민 전용
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const { reviewId, content, rating } = body;

        if (!reviewId) {
            return NextResponse.json({ error: '리뷰 ID가 필요합니다.' }, { status: 400 });
        }

        const updateData: any = {};
        if (content !== undefined) updateData.content = content;
        if (rating !== undefined) updateData.rating = rating;

        const { data, error } = await supabase
            .from('Review')
            .update(updateData)
            .eq('id', reviewId)
            .select()
            .single();

        if (error) {
            console.error('Update error:', error);
            return NextResponse.json({ error: '수정 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true, review: data });

    } catch (error) {
        console.error('Update review error:', error);
        return NextResponse.json({ error: '수정 실패' }, { status: 500 });
    }
}
