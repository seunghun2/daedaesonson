
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Facility, Review, ReviewReply } from '@/types';

const DATA_PATH = path.join(process.cwd(), 'data/facilities.json');

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facilityId, reviewId, action, content, author } = body;

        // Base validation
        if (!facilityId || !reviewId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const fileContent = fs.readFileSync(DATA_PATH, 'utf-8');
        const facilities: Facility[] = JSON.parse(fileContent);

        const facilityIndex = facilities.findIndex(f => f.id === facilityId);
        if (facilityIndex === -1) {
            return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
        }

        const facility = facilities[facilityIndex];
        const reviewIndex = facility.reviews?.findIndex(r => r.id === reviewId);

        if (reviewIndex === undefined || reviewIndex === -1 || !facility.reviews) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        const review = facility.reviews[reviewIndex];

        // Handle Actions
        if (action === 'LIKE') {
            review.likes = (review.likes || 0) + 1;
        } else if (action === 'UNLIKE') {
            review.likes = Math.max(0, (review.likes || 0) - 1);
        } else if (action === 'REPLY') {
            if (!content) return NextResponse.json({ error: 'Reply content required' }, { status: 400 });

            const newReply: ReviewReply = {
                id: `rep-${Date.now()}`,
                author: author || '관리자', // Default to admin for now, or from request
                content: content,
                date: new Date().toISOString().split('T')[0]
            };

            review.replies = review.replies || [];
            review.replies.push(newReply);
        } else if (action === 'DELETE_REVIEW') {
            facility.reviews.splice(reviewIndex, 1);
        } else if (action === 'DELETE_REPLY') {
            const { replyId } = body;
            if (!replyId) return NextResponse.json({ error: 'Reply ID required' }, { status: 400 });

            review.replies = review.replies?.filter(r => r.id !== replyId) || [];
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        // Apply changes
        facility.reviews[reviewIndex] = review;
        facilities[facilityIndex] = facility;

        // Save
        fs.writeFileSync(DATA_PATH, JSON.stringify(facilities, null, 2), 'utf-8');

        return NextResponse.json({ success: true, review });

    } catch (error) {
        console.error('Interaction API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
