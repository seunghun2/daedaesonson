import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

// GET: 1:1 문의 목록 (어드민용)
export async function GET() {
    try {
        const { data, error } = await supabase
            .from('contact_inquiries')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return NextResponse.json(data || []);
    } catch (error: any) {
        console.error('1:1 문의 조회 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: 1:1 문의 등록 (사용자용)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { inquiry_type, title, content, contact } = body;

        if (!inquiry_type || !title || !content || !contact) {
            return NextResponse.json({ error: '모든 필드를 입력해주세요' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('contact_inquiries')
            .insert({
                inquiry_type,
                title,
                content,
                contact,
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('1:1 문의 등록 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
