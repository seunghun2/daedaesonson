import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rateLimit';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { sendSlack, escapeSlack } from '@/lib/slack';
import { verifyAdminToken } from '@/lib/adminAuth';
import bcrypt from 'bcryptjs';

const supabase = getSupabaseServer();

// 리뷰 작성 (POST)
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    const { id } = await context.params;

    // Rate Limiting (IP당 1분 3회)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `review-post:${ip}:${id}`, limit: 3, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json(
            { error: '너무 많은 리뷰를 등록했습니다. 잠시 후 다시 시도해주세요.' },
            { status: 429 }
        );
    }

    try {
        const body = await request.json();
        const { rating, content, author, password, photos, userId } = body;

        // Validation: 평점 1~5 정수 검증 및 내용 길이 제한
        const numRating = Number(rating);
        if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
            return NextResponse.json(
                { error: '평점은 1점에서 5점 사이의 정수여야 합니다.' },
                { status: 400 }
            );
        }

        if (typeof content !== 'string' || content.trim().length < 2 || content.length > 2000) {
            return NextResponse.json(
                { error: '리뷰 내용은 2자 이상 2,000자 이내로 입력해주세요.' },
                { status: 400 }
            );
        }

        // Token verification for logged-in user (SEC-04 IDOR 방어)
        let verifiedUserId: string | null = null;
        if (userId) {
            const authHeader = request.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                const token = authHeader.substring(7);
                const { data: { user } } = await supabase.auth.getUser(token);
                if (user && user.id === userId) {
                    verifiedUserId = user.id;
                }
            }
        }

        // 비로그인 유저 또는 토큰 검증 실패한 경우 비밀번호 필수
        if (!verifiedUserId) {
            if (!password || password.length < 4) {
                return NextResponse.json(
                    { error: '비밀번호는 4자 이상 입력해주세요.' },
                    { status: 400 }
                );
            }
        }

        // Hash password (비로그인 유저만) - bcrypt rounds 10 (안전성 확보)
        // 시설정보 미리 조회를 병렬로 실행
        const [hashedPassword, facilityResult] = await Promise.all([
            password ? bcrypt.hash(password, 10) : Promise.resolve(null),
            supabase
                .from('Facility')
                .select('reviewCount, rating, name')
                .eq('id', id)
                .single()
        ]);

        const facility = facilityResult.data;

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
                userId: verifiedUserId,
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

        // Update facility reviewCount + 평균 평점 재계산 (병렬)
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

            // DB 업데이트는 fire-and-forget (응답 지연 방지)
            (async () => {
                const { error } = await supabase
                    .from('Facility')
                    .update({ reviewCount: newCount, rating: avgRating })
                    .eq('id', id);
                if (error) console.error('Facility update error:', error);
            })();
        }

        // Slack 알림 — fire-and-forget (응답 블로킹 제거, 인젝션 방지 escapeSlack 적용)
        sendSlack('review', `⭐ *새 이용 후기!*\n• 시설: ${escapeSlack(facility?.name || id)}\n• 평점: ${'⭐'.repeat(numRating)}\n• 작성자: ${escapeSlack(author || '익명')}\n• 내용: ${escapeSlack(content.slice(0, 100))}...`)
            .catch((e) => console.error('Slack send error:', e));

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
        const { reviewId, password } = body;
        const cookieStore = await cookies();
        const isAdmin = await verifyAdminToken(cookieStore.get('admin_session')?.value);



        const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
        const rateCheck = rateLimit({ key: `review-del:${ip}:${reviewId}`, limit: 5, windowMs: 60000 });
        if (!rateCheck.success) return NextResponse.json({ error: '너무 많은 요청입니다.' }, { status: 429 });

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

        if (review.facilityId !== facilityId) {
            return NextResponse.json(
                { error: '잘못된 요청입니다.' },
                { status: 400 }
            );
        }

        // Admin bypass, owner bypass (verified via JWT), or password check
        let tokenUserId: string | null = null;
        const authHeader = request.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const supabaseAnon = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
            );
            const { data: { user } } = await supabaseAnon.auth.getUser(token);
            if (user) {
                tokenUserId = user.id;
            }
        }

        const isOwner = Boolean(tokenUserId && review.userId && tokenUserId === review.userId);
        if (!isAdmin && !isOwner) {
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

        // Update facility reviewCount & recalculate average rating accurately
        const { data: remainingReviews } = await supabase
            .from('Review')
            .select('rating')
            .eq('facilityId', facilityId);

        const count = remainingReviews?.length || 0;
        const avgRating = count > 0
            ? parseFloat((remainingReviews!.reduce((sum, r) => sum + (r.rating || 0), 0) / count).toFixed(1))
            : 0;

        await supabase
            .from('Facility')
            .update({ reviewCount: count, rating: avgRating })
            .eq('id', facilityId);

        return NextResponse.json({ success: true, updatedStats: { reviewCount: count, rating: avgRating } });

    } catch (error) {
        console.error('Failed to delete review:', error);
        return NextResponse.json(
            { error: '삭제 중 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}
