import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// JSON 파일 경로
const DATA_FILE = path.join(process.cwd(), 'data/pricing_db.json');

// GET: 전체 데이터 조회
export async function GET(request: Request) {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return NextResponse.json([]);
        }
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        try {
            const data = JSON.parse(content);

            // 검색 필터링 (선택 사항)
            const { searchParams } = new URL(request.url);
            const query = searchParams.get('search'); // page.tsx uses 'search'

            if (query) {
                const lowerQuery = query.toLowerCase();
                const filtered = data.filter((item: any) =>
                    (item.parkName && item.parkName.toLowerCase().includes(lowerQuery)) ||
                    (item.itemName1 && item.itemName1.toLowerCase().includes(lowerQuery))
                );
                return NextResponse.json(filtered);
            }

            return NextResponse.json(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            return NextResponse.json([]);
        }
    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}

// POST: 데이터 수정 (안전하게 복구)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        // ID 기반 업데이트는 현재 데이터가 재로드되면 ID가 바뀔 수 있어 주의 필요
        // 하지만 일단 저장은 가능하게 함

        if (!fs.existsSync(DATA_FILE)) {
            return NextResponse.json({ success: false, message: 'Data file not found' }, { status: 404 });
        }
        const content = fs.readFileSync(DATA_FILE, 'utf-8');
        let data = JSON.parse(content);

        // Update logic... (Simplified)
        const updates = Array.isArray(body) ? body : [body];
        let updateCount = 0;

        updates.forEach((update: any) => {
            const index = data.findIndex((item: any) => item.id === update.id);
            if (index !== -1) {
                // Allow specific field updates
                const fields = ['price', 'rawText', 'category1', 'category2', 'category3', 'itemName1', 'itemName2', 'category0'];
                fields.forEach(f => {
                    if (update[f] !== undefined) data[index][f] = update[f];
                });
                updateCount++;
            }
        });

        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return NextResponse.json({ success: true, count: updateCount });

    } catch (error) {
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
