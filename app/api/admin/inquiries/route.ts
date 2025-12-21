import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// 시설명 매핑 (lazy load)
let facilityNameMap: Map<string, string> | null = null;

function getFacilityNameMap() {
    if (!facilityNameMap) {
        try {
            const filePath = path.join(process.cwd(), 'public', 'data', 'facilities.json');
            const data = fs.readFileSync(filePath, 'utf-8');
            const facilities = JSON.parse(data);
            facilityNameMap = new Map(facilities.map((f: any) => [f.id, f.name]));
        } catch (e) {
            console.error('Failed to load facilities:', e);
            facilityNameMap = new Map();
        }
    }
    return facilityNameMap;
}

// GET: 모든 문의 조회 (어드민용)
export async function GET() {
    try {
        const { data: inquiries, error } = await supabase
            .from('Inquiry')
            .select(`
                *,
                replies:InquiryReply(*)
            `)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Fetch inquiries error:', error);
            return NextResponse.json({ error: '문의 조회 실패' }, { status: 500 });
        }

        // 시설명 추가
        const nameMap = getFacilityNameMap();
        const enrichedInquiries = (inquiries || []).map(inq => ({
            ...inq,
            facilityName: nameMap.get(inq.facilityId) || '시설'
        }));

        return NextResponse.json({ inquiries: enrichedInquiries });

    } catch (error) {
        console.error('Admin inquiries GET error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// POST: 답변 등록
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { inquiryId, content } = body;

        if (!inquiryId || !content?.trim()) {
            return NextResponse.json({ error: '문의 ID와 답변 내용을 입력해주세요.' }, { status: 400 });
        }

        // Insert reply
        const { data: newReply, error } = await supabase
            .from('InquiryReply')
            .insert({
                inquiryId,
                author: '관리자',
                content: content.trim(),
                createdAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Insert reply error:', error);
            return NextResponse.json({ error: '답변 등록 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true, reply: newReply });

    } catch (error) {
        console.error('Admin inquiries POST error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// DELETE: 문의 삭제 (어드민)
export async function DELETE(request: NextRequest) {
    try {
        const body = await request.json();
        const { inquiryId } = body;

        if (!inquiryId) {
            return NextResponse.json({ error: '문의 ID가 필요합니다.' }, { status: 400 });
        }

        // Delete replies first
        await supabase.from('InquiryReply').delete().eq('inquiryId', inquiryId);

        // Delete inquiry
        const { error } = await supabase
            .from('Inquiry')
            .delete()
            .eq('id', inquiryId);

        if (error) {
            console.error('Delete inquiry error:', error);
            return NextResponse.json({ error: '삭제 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin inquiries DELETE error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
