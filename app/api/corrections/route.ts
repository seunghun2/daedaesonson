// 정보 수정 요청 API
import { getSupabaseServer } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';
import { sendSlack, sendSlackError, escapeSlack } from '@/lib/slack';
import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';

const supabase = getSupabaseServer();

// POST: 정보 수정 요청 등록
export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `corrections-post:${ip}`, limit: 5, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json({ error: '너무 많은 요청입니다. 1분 후 다시 시도해주세요.' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { facility_id, facility_name, correction_type, content, contact, name, photos } = body;

        if (!facility_id || !facility_name || !correction_type || !content) {
            return NextResponse.json({ error: '필수 항목을 모두 입력해주세요.' }, { status: 400 });
        }

        if (String(content).trim().length < 5 || String(content).length > 2000) {
            return NextResponse.json({ error: '수정 요청 내용은 5자 이상 2,000자 이내로 작성해주세요.' }, { status: 400 });
        }

        if (contact && String(contact).length > 50) {
            return NextResponse.json({ error: '연락처가 너무 깁니다.' }, { status: 400 });
        }

        if (photos && (!Array.isArray(photos) || photos.length > 5)) {
            return NextResponse.json({ error: '사진은 최대 5개까지 첨부 가능합니다.' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('facility_corrections')
            .insert({
                facility_id,
                facility_name,
                correction_type,
                content,
                contact: contact || null,
                name: name || null,
                photos: photos || null,
                status: 'pending',
            })
            .select()
            .single();

        if (error) {
            console.error('Correction insert error:', error);
            await sendSlackError('corrections', error);
            return NextResponse.json({ error: '등록에 실패했습니다.' }, { status: 500 });
        }

        // Slack 알림 (인젝션 방지 escapeSlack 적용)
        await sendSlack('correction', `✏️ *정보 수정 요청!*\n• 시설: ${escapeSlack(facility_name)}\n• 유형: ${escapeSlack(correction_type)}\n• 내용: ${escapeSlack(content.slice(0, 100))}...\n• 요청자: ${escapeSlack(name || '미입력')}\n• 연락처: ${escapeSlack(contact || '미입력')}`);

        return NextResponse.json({ success: true, data });
    } catch (err) {
        console.error('Correction API error:', err);
        return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}

// GET: 정보 수정 요청 목록 (어드민)
export async function GET(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        let query = supabase
            .from('facility_corrections')
            .select('*')
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        const [filteredResult, countResult] = await Promise.all([
            query,
            supabase.from('facility_corrections').select('status')
        ]);

        if (filteredResult.error) {
            return NextResponse.json({ error: '데이터 조회 실패' }, { status: 500 });
        }

        const allStatuses = countResult.data || [];
        const counts = {
            all: allStatuses.length,
            pending: allStatuses.filter(c => c.status === 'pending').length,
            in_progress: allStatuses.filter(c => c.status === 'in_progress').length,
            resolved: allStatuses.filter(c => c.status === 'resolved').length,
            rejected: allStatuses.filter(c => c.status === 'rejected').length,
        };

        return NextResponse.json({ data: filteredResult.data, counts });
    } catch (err) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}


// PATCH: 상태 업데이트 (어드민)
export async function PATCH(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const body = await request.json();
        const { id, status, admin_note } = body;

        const updateData: any = { status };
        if (admin_note !== undefined) updateData.admin_note = admin_note;

        const { error } = await supabase
            .from('facility_corrections')
            .update(updateData)
            .eq('id', id);

        if (error) {
            return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: '서버 오류' }, { status: 500 });
    }
}
