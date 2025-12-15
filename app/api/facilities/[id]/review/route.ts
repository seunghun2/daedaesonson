
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { Facility, Review } from '@/types';

const DATA_PATH = path.join(process.cwd(), 'data/facilities.json');

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Updated to match Next.js 15+ async params
) {
    const { id } = await context.params;

    try {
        const body = await request.json();
        const { rating, content, author, password, photos } = body;

        // Basic validation
        if (!rating || !content) {
            return NextResponse.json(
                { error: '평점과 내용은 필수입니다.' },
                { status: 400 }
            );
        }

        // Read existing data directly from JSON file
        const fileContent = fs.readFileSync(DATA_PATH, 'utf-8');
        const facilities: Facility[] = JSON.parse(fileContent);

        const facilityIndex = facilities.findIndex((f) => f.id === id);

        if (facilityIndex === -1) {
            return NextResponse.json(
                { error: '시설을 찾을 수 없습니다.' },
                { status: 404 }
            );
        }

        const facility = facilities[facilityIndex];
        const currentReviews = facility.reviews || [];

        // Create new review object
        const newReview: Review = {
            id: `rev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            author: author || '익명', // Default to '익명' if not provided
            date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
            rating: Number(rating),
            content: content,
            likes: 0,
            photos: photos || [], // Store base64 strings
            replies: [],           // Initialize empty replies
            tags: [] // TODO: Add tags support later
        };

        // Add to reviews array
        const updatedReviews = [newReview, ...currentReviews];

        // Recalculate average rating
        const totalRating = updatedReviews.reduce((sum, rev) => sum + rev.rating, 0);
        const averageRating = parseFloat((totalRating / updatedReviews.length).toFixed(1));

        // Update facility object
        facilities[facilityIndex] = {
            ...facility,
            reviews: updatedReviews,
            rating: averageRating,
            reviewCount: updatedReviews.length
        };

        // Write back to file
        fs.writeFileSync(DATA_PATH, JSON.stringify(facilities, null, 2), 'utf-8');

        return NextResponse.json({
            success: true,
            review: newReview,
            updatedStats: {
                rating: averageRating,
                reviewCount: updatedReviews.length
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
