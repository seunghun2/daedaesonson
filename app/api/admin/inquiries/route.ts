import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';

const supabase = getSupabaseServer();

// GET: 모든 문의 조회 (어드민용) - 최적화
export async function GET() {
    try {
        const { data: inquiries, error } = await supabase
            .from('Inquiry')
            .select(`
                *,
                replies:InquiryReply(*)
            `)
            .order('createdAt', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Fetch inquiries error:', error);
            return NextResponse.json({ error: '문의 조회 실패' }, { status: 500 });
        }

        // 문의에 있는 시설 ID들 추출
        const facilityIds = [...new Set((inquiries || []).map(inq => inq.facilityId))];

        // Supabase에서 시설명 조회
        let facilityNameMap = new Map<string, string>();
        if (facilityIds.length > 0) {
            const { data: facilities } = await supabase
                .from('Facility')
                .select('id, name')
                .in('id', facilityIds);

            if (facilities) {
                facilityNameMap = new Map(facilities.map(f => [f.id, f.name]));
            }
        }

        // 시설명 추가
        const enrichedInquiries = (inquiries || []).map(inq => ({
            ...inq,
            facilityName: facilityNameMap.get(inq.facilityId) || '시설'
        }));

        // 🔥 30초 캐시 (빠른 응답)
        return NextResponse.json({ inquiries: enrichedInquiries }, {
            headers: {
                'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60'
            }
        });

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
