import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facilityId, reviewId, action, content, author, password, replyId, isAdmin } = body;

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

            // Insert reply to Reply table
            const { data: newReply, error } = await supabase
                .from('Reply')
                .insert({
                    reviewId: reviewId,
                    author: author || '관리자',
                    content: content,
                    createdAt: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            return NextResponse.json({ success: true, reply: newReply });

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
