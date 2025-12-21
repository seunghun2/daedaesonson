import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// 리뷰 작성 (POST)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    try {
        const body = await request.json();
        const { rating, content, author, password, photos } = body;

        // Validation
        if (!rating || !content) {
            return NextResponse.json(
                { error: '평점과 내용은 필수입니다.' },
                { status: 400 }
            );
        }

        if (!password || password.length < 4) {
            return NextResponse.json(
                { error: '비밀번호는 4자 이상 입력해주세요.' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create review in Supabase
        const { data: newReview, error } = await supabase
            .from('Review')
            .insert({
                facilityId: id,
                author: author || '익명',
                content: content,
                rating: Number(rating),
                password: hashedPassword,
                photos: photos || [],
                likes: 0,
                createdAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error:', error);
            return NextResponse.json(
                { error: '리뷰 저장 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // Update facility reviewCount
        const { data: facility } = await supabase
            .from('Facility')
            .select('reviewCount, rating')
            .eq('id', id)
            .single();

        if (facility) {
            const newCount = (facility.reviewCount || 0) + 1;

            // Recalculate average rating
            const { data: allReviews } = await supabase
                .from('Review')
                .select('rating')
                .eq('facilityId', id);

            const avgRating = allReviews && allReviews.length > 0
                ? parseFloat((allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1))
                : rating;

            await supabase
                .from('Facility')
                .update({ reviewCount: newCount, rating: avgRating })
                .eq('id', id);
        }

        // Return without password
        const { password: _, ...safeReview } = newReview;

        return NextResponse.json({
            success: true,
            review: safeReview,
            updatedStats: {
                reviewCount: (facility?.reviewCount || 0) + 1
            }
        });

    } catch (error) {
        console.error('Failed to add review:', error);
        return NextResponse.json(
            { error: '리뷰 저장 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// 리뷰 삭제 (DELETE)
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id: facilityId } = await context.params;

    try {
        const body = await request.json();
        const { reviewId, password, isAdmin } = body;

        if (!reviewId) {
            return NextResponse.json(
                { error: '리뷰 ID가 필요합니다.' },
                { status: 400 }
            );
        }

        // Get review
        const { data: review, error: fetchError } = await supabase
            .from('Review')
            .select('*')
            .eq('id', reviewId)
            .single();

        if (fetchError || !review) {
            return NextResponse.json(
                { error: '리뷰를 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        // Admin bypass or password check
        if (!isAdmin) {
            if (!password) {
                return NextResponse.json(
                    { error: '비밀번호를 입력해주세요.' },
                    { status: 400 }
                );
            }

            const isMatch = await bcrypt.compare(password, review.password || '');
            if (!isMatch) {
                return NextResponse.json(
                    { error: '비밀번호가 일치하지 않습니다.' },
                    { status: 403 }
                );
            }
        }

        // Delete review
        const { error: deleteError } = await supabase
            .from('Review')
            .delete()
            .eq('id', reviewId);

        if (deleteError) {
            console.error('Delete error:', deleteError);
            return NextResponse.json(
                { error: '삭제 중 오류가 발생했습니다.' },
                { status: 500 }
            );
        }

        // Update facility reviewCount
        const { data: facility } = await supabase
            .from('Facility')
            .select('reviewCount')
            .eq('id', facilityId)
            .single();

        if (facility && facility.reviewCount > 0) {
            await supabase
                .from('Facility')
                .update({ reviewCount: facility.reviewCount - 1 })
                .eq('id', facilityId);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Failed to delete review:', error);
        return NextResponse.json(
            { error: '삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
