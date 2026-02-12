import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// POST: 상담 신청
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { facilityId, facilityName, name, phone, preferredTime, question, message, consultMethod } = body;

        if (!facilityId || !name || !phone) {
            return NextResponse.json({ error: '필수 정보를 입력해주세요.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('Consult')
            .insert({
                facilityId,
                facilityName,
                name,
                phone,
                preferredTime: preferredTime || null,
                question: question || 'price',
                message: message || null,
                consultMethod: consultMethod || 'phone',
                status: 'pending',
                createdAt: new Date().toISOString()
            })
            .select()
            .single();

        if (error) {
            console.error('Insert consult error:', error);
            return NextResponse.json({ error: '상담 신청 실패' }, { status: 500 });
        }

        return NextResponse.json({ success: true, consult: data });

    } catch (error) {
        console.error('Consult POST error:', error);
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}

// GET: 모든 상담 조회 (어드민용)
export async function GET() {
    try {
        const { data: consults, error } = await supabase
            .from('Consult')
            .select('*')
            .order('createdAt', { ascending: false });

        if (error) {
            return NextResponse.json({ error: '조회 실패' }, { status: 500 });
        }

        return NextResponse.json({ consults: consults || [] });
    } catch (error) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
