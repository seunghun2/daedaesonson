import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET: 약관/정책 조회
export async function GET(
    request: Request,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const { type } = await params;

        const { data, error } = await supabase
            .from('site_policies')
            .select('*')
            .eq('type', type)
            .single();

        if (error && error.code !== 'PGRST116') throw error;
        return NextResponse.json(data || null);
    } catch (error: any) {
        console.error('정책 조회 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PUT: 약관/정책 수정
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ type: string }> }
) {
    try {
        const { type } = await params;
        const body = await request.json();
        const { title, content, version } = body;

        // upsert로 없으면 생성, 있으면 수정
        const { data, error } = await supabase
            .from('site_policies')
            .upsert({
                type,
                title,
                content,
                version,
                updated_at: new Date().toISOString()
            }, { onConflict: 'type' })
            .select()
            .single();

        if (error) throw error;
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('정책 수정 오류:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
