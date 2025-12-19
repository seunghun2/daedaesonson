import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const FACILITIES_PATH = path.join(process.cwd(), 'data', 'facilities.json');

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // facilities.json 읽기
        const data = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf-8'));

        // 해당 시설 찾기
        const facilityIndex = data.findIndex((f: any) => f.id === id);

        if (facilityIndex === -1) {
            return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
        }

        // viewCount 초기화 (없으면 랜덤 시작)
        if (!data[facilityIndex].viewCount) {
            // ID 기반 랜덤 시작값 (50~500)
            const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            data[facilityIndex].viewCount = 50 + (hash * 17) % 450;
        }

        // 조회수 +1
        data[facilityIndex].viewCount += 1;

        // 파일에 저장
        fs.writeFileSync(FACILITIES_PATH, JSON.stringify(data, null, 2));

        return NextResponse.json({
            viewCount: data[facilityIndex].viewCount,
            success: true
        });
    } catch (error) {
        console.error('View count error:', error);
        return NextResponse.json({ error: 'Failed to update view count' }, { status: 500 });
    }
}

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const data = JSON.parse(fs.readFileSync(FACILITIES_PATH, 'utf-8'));
        const facility = data.find((f: any) => f.id === id);

        if (!facility) {
            return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
        }

        // viewCount 없으면 계산
        let viewCount = facility.viewCount;
        if (!viewCount) {
            const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            viewCount = 50 + (hash * 17) % 450;
        }

        return NextResponse.json({ viewCount });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to get view count' }, { status: 500 });
    }
}
