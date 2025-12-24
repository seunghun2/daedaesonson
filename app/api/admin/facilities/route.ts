import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false }
});

export const revalidate = 0;
export const dynamic = 'force-dynamic';

// ==========================================
// GET: 어드민용 시설 목록 (서버 사이드 페이지네이션)
// ==========================================
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // 쿼리 파라미터 파싱
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '15');
        const search = searchParams.get('search') || '';
        const searchTarget = searchParams.get('searchTarget') || 'all';
        const category = searchParams.get('category') || 'all';
        const sortBy = searchParams.get('sortBy') || 'id';
        const sortOrder = searchParams.get('sortOrder') || 'asc';

        console.log(`[Admin API] page=${page}, limit=${limit}, search="${search}", category=${category}`);

        // 기본 쿼리 - 필요한 필드만 선택 (pricing 제외!)
        let query = supabase
            .from('Facility')
            .select('id, name, address, category, isPublic, capacity, lastUpdated', { count: 'exact' });

        // 카테고리 필터
        if (category !== 'all') {
            query = query.eq('category', category);
        }

        // 검색 필터 (서버 사이드)
        if (search) {
            if (searchTarget === 'name') {
                query = query.ilike('name', `%${search}%`);
            } else if (searchTarget === 'address') {
                query = query.ilike('address', `%${search}%`);
            } else if (searchTarget === 'id') {
                query = query.ilike('id', `%${search}%`);
            } else {
                // 'all' - OR 조건
                query = query.or(`name.ilike.%${search}%,address.ilike.%${search}%,id.ilike.%${search}%`);
            }
        }

        // 정렬
        const ascending = sortOrder === 'asc';
        if (sortBy === 'id') {
            query = query.order('id', { ascending });
        } else if (sortBy === 'name') {
            query = query.order('name', { ascending });
        } else if (sortBy === 'capacity') {
            query = query.order('capacity', { ascending, nullsFirst: false });
        } else if (sortBy === 'updatedAt') {
            query = query.order('lastUpdated', { ascending, nullsFirst: false });
        }

        // 페이지네이션
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
            console.error('[Admin API] Error:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        console.log(`[Admin API] Returned ${data?.length || 0} of ${count} total`);

        return NextResponse.json({
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (e) {
        console.error('[Admin API] Error:', e);
        return NextResponse.json({ error: String(e) }, { status: 500 });
    }
}
