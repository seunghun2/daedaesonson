import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, companyName, email, name, phone, content } = body;

        if (!companyName || !email || !name || !phone || !content) {
            return NextResponse.json(
                { error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        const supabase = getSupabaseServer();
        const { data, error } = await supabase
            .from('partnership_inquiries')
            .insert({
                type,
                company_name: companyName,
                email,
                contact_name: name,
                phone,
                content,
                status: 'pending',
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, inquiry: data });
    } catch (error) {
        console.error('Partnership API error:', error);
        return NextResponse.json(
            { error: '서버 오류가 발생했습니다.' },
            { status: 500 }
        );
    }
}

// GET - 제휴 문의 목록 조회 (관리자용)
export async function GET() {
    try {
        const supabase = getSupabaseServer();
        const { data, error } = await supabase
            .from('partnership_inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ inquiries: data || [] });
    } catch (error) {
        console.error('Partnership GET error:', error);
        return NextResponse.json({ inquiries: [] });
    }
}
