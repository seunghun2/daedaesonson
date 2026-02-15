import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import bcrypt from 'bcryptjs';

const supabase = getSupabaseServer();

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facilityId, reviewId, action, content, author, password, replyId, isAdmin, photos } = body;

        // Base validation
        if (!reviewId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Get review
        const { data: review, error: fetchError } = await supabase
            .from('Review')
            .select('*')
            .eq('id', reviewId)
            .single();

        if (fetchError || !review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        // Handle Actions
        if (action === 'LIKE') {
            const { error } = await supabase
                .from('Review')
                .update({ likes: (review.likes || 0) + 1 })
                .eq('id', reviewId);

            if (error) throw error;

            return NextResponse.json({ success: true, likes: (review.likes || 0) + 1 });

        } else if (action === 'UNLIKE') {
            const newLikes = Math.max(0, (review.likes || 0) - 1);
            const { error } = await supabase
                .from('Review')
                .update({ likes: newLikes })
                .eq('id', reviewId);

            if (error) throw error;

            return NextResponse.json({ success: true, likes: newLikes });

        } else if (action === 'REPLY') {
            if (!content) {
                return NextResponse.json({ error: 'Reply content required' }, { status: 400 });
            }
            if (!author) {
                return NextResponse.json({ error: '닉네임을 입력해주세요.' }, { status: 400 });
            }
            if (!password && !isAdmin) {
                return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
            }

            // Hash password
            let hashedPassword = null;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }

            // Insert reply to Reply table
            const { data: newReply, error } = await supabase
                .from('Reply')
                .insert({
                    reviewId: reviewId,
                    author: author,
                    content: content,
                    photos: photos || [],
                    password: hashedPassword,
                    createdAt: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // password 제거 후 반환
            const { password: _, ...safeReply } = newReply;
            return NextResponse.json({ success: true, reply: safeReply });

        } else if (action === 'DELETE_REVIEW') {
            // Check permission
            if (!isAdmin) {
                if (!password) {
                    return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
                }

                const isMatch = await bcrypt.compare(password, review.password || '');
                if (!isMatch) {
                    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
                }
            }

            // Delete all replies first
            await supabase.from('Reply').delete().eq('reviewId', reviewId);

            // Delete review
            const { error } = await supabase.from('Review').delete().eq('id', reviewId);
            if (error) throw error;

            // Update facility reviewCount
            if (review.facilityId) {
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

        } else if (action === 'DELETE_REPLY') {
            if (!replyId) {
                return NextResponse.json({ error: 'Reply ID required' }, { status: 400 });
            }

            // 관리자가 아니면 비밀번호 확인
            if (!isAdmin) {
                if (!password) {
                    return NextResponse.json({ error: '비밀번호를 입력해주세요.' }, { status: 400 });
                }

                const { data: reply } = await supabase
                    .from('Reply')
                    .select('password')
                    .eq('id', replyId)
                    .single();

                if (!reply) {
                    return NextResponse.json({ error: '댓글을 찾을 수 없습니다.' }, { status: 404 });
                }

                const isMatch = await bcrypt.compare(password, reply.password || '');
                if (!isMatch) {
                    return NextResponse.json({ error: '비밀번호가 일치하지 않습니다.' }, { status: 403 });
                }
            }

            const { error } = await supabase.from('Reply').delete().eq('id', replyId);
            if (error) throw error;

            return NextResponse.json({ success: true });

        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

    } catch (error) {
        console.error('Interaction API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
