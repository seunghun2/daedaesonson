import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'data', 'partnership_inquiries.json');

// 데이터 파일 읽기
function readInquiries(): any[] {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Failed to read inquiries:', error);
    }
    return [];
}

// 데이터 파일 쓰기
function writeInquiries(inquiries: any[]): void {
    try {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(inquiries, null, 2), 'utf-8');
    } catch (error) {
        console.error('Failed to write inquiries:', error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, companyName, email, name, phone, content } = body;

        // Validate required fields
        if (!companyName || !email || !name || !phone || !content) {
            return NextResponse.json(
                { error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        const newInquiry = {
            id: `partnership_${Date.now()}`,
            type,
            company_name: companyName,
            email,
            contact_name: name,
            phone,
            content,
            status: 'pending',
            created_at: new Date().toISOString(),
        };

        // 기존 데이터 읽고 추가
        const inquiries = readInquiries();
        inquiries.unshift(newInquiry);
        writeInquiries(inquiries);

        // 📊 로깅
        console.log('📩 Partnership inquiry received:', {
            type,
            companyName,
            email,
            phone,
        });

        return NextResponse.json({ success: true, inquiry: newInquiry });
    } catch (error) {
        console.error('Partnership API error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// GET - 광고/제휴 문의 목록 조회 (관리자용)
export async function GET() {
    try {
        const inquiries = readInquiries();
        return NextResponse.json({ inquiries });
    } catch (error) {
        console.error('Partnership GET error:', error);
        return NextResponse.json({ inquiries: [] });
    }
}
