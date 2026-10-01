import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/adminAuth';

// JSON 파일 경로
const DATA_FILE = path.join(process.cwd(), 'data/pricing_db.json');

// GET: 전체 데이터 조회
export async function GET(request: Request) {
    const authError = await requireAdmin();
    if (authError) return authError;

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

// POST: 데이터 수정 — Vercel 서버리스 환경에서 파일 쓰기 불가 (EROFS)
// TODO: Supabase DB 기반으로 전환 필요
export async function POST() {
    const authError = await requireAdmin();
    if (authError) return authError;
    return NextResponse.json(
        { success: false, error: '이 API는 현재 비활성화되어 있습니다. Supabase DB를 통해 가격을 관리해주세요.' },
        { status: 501 }
    );
}
