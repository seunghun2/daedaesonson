import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET: 유저의 관심 시설 목록 조회
export async function GET(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data, error } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ favorites: data });
}

// POST: 관심 시설 토글 (추가/삭제)
export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { facilityId } = await request.json();
    if (!facilityId) return NextResponse.json({ error: 'facilityId required' }, { status: 400 });

    // 이미 있는지 확인
    const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('facility_id', String(facilityId))
        .single();

    if (existing) {
        // 삭제
        await supabase.from('favorites').delete().eq('id', existing.id);
        return NextResponse.json({ action: 'removed', facilityId });
    } else {
        // 추가
        const { error } = await supabase.from('favorites').insert({
            user_id: user.id,
            facility_id: String(facilityId),
        });
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
        return NextResponse.json({ action: 'added', facilityId });
    }
}
