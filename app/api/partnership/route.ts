import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { sendSlack, sendSlackError, escapeSlack } from '@/lib/slack';
import { requireAdmin } from '@/lib/adminAuth';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
    const rateCheck = rateLimit({ key: `partnership-post:${ip}`, limit: 5, windowMs: 60000 });
    if (!rateCheck.success) {
        return NextResponse.json({ error: '너무 많은 요청입니다. 1분 후 다시 시도해주세요.' }, { status: 429 });
    }

    try {
        const body = await request.json();
        const { type, companyName, email, name, phone, content } = body;

        if (!companyName || !email || !name || !phone || !content) {
            return NextResponse.json(
                { error: '필수 항목을 모두 입력해주세요.' },
                { status: 400 }
            );
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(String(email).trim()) || String(email).length > 100) {
            return NextResponse.json({ error: '올바른 이메일 주소를 입력해주세요.' }, { status: 400 });
        }

        const cleanPhone = String(phone).replace(/[^0-9]/g, '');
        if (cleanPhone.length < 8 || cleanPhone.length > 15) {
            return NextResponse.json({ error: '올바른 전화번호를 입력해주세요.' }, { status: 400 });
        }

        if (String(content).trim().length < 5 || String(content).length > 3000) {
            return NextResponse.json({ error: '문의 내용은 5자 이상 3,000자 이내로 입력해주세요.' }, { status: 400 });
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

        // Slack 알림 (인젝션 방지 escapeSlack 적용)
        await sendSlack('partnership', `🤝 *새 제휴 문의!*\n• 유형: ${escapeSlack(type || '일반')}\n• 회사: ${escapeSlack(companyName)}\n• 담당자: ${escapeSlack(name)}\n• 연락처: ${escapeSlack(phone)}\n• 이메일: ${escapeSlack(email)}\n• 내용: ${escapeSlack(content.slice(0, 100))}...`);

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
    const authError = await requireAdmin();
    if (authError) return authError;

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

export async function PATCH(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { id, status, admin_note } = await request.json();
        const supabase = getSupabaseServer();
        const { error } = await supabase
            .from('partnership_inquiries')
            .update({ status, admin_note })
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Partnership PATCH error:', error);
        return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const { id } = await request.json();
        const supabase = getSupabaseServer();
        const { error } = await supabase
            .from('partnership_inquiries')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Partnership DELETE error:', error);
        return NextResponse.json({ error: '요청을 처리할 수 없습니다.' }, { status: 500 });
    }
}
