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

    if (error) return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
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

    const { facilityId, action } = await request.json();
    if (!facilityId) return NextResponse.json({ error: 'facilityId required' }, { status: 400 });
    const fid = String(facilityId);

    // ⚠️ 예전에는 "있으면 삭제/없으면 추가" 토글이었음 → 화면 목록이 덜 불러와진 상태(빈 별)에서
    //    '추가'를 누르면 실제로는 기존 관심시설이 삭제되는 버그. 이제 의도(action)를 명시적으로 받음.
    if (action === 'remove') {
        const { error } = await supabase.from('favorites').delete().eq('user_id', user.id).eq('facility_id', fid);
        if (error) return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
        return NextResponse.json({ action: 'removed', facilityId: fid });
    }

    if (action === 'add') {
        const { data: existing } = await supabase
            .from('favorites').select('id').eq('user_id', user.id).eq('facility_id', fid).maybeSingle();
        if (!existing) {
            const { error } = await supabase.from('favorites').insert({ user_id: user.id, facility_id: fid });
            // 23505 = 동시 요청으로 이미 추가됨 → 성공으로 간주
            if (error && error.code !== '23505') return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
        }
        return NextResponse.json({ action: 'added', facilityId: fid });
    }

    return NextResponse.json({ error: "action must be 'add' or 'remove'" }, { status: 400 });
}
