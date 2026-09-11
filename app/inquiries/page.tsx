import { Suspense } from 'react';
import { getSupabaseServer } from '@/lib/supabaseServer';
import InquiriesClient from './InquiriesClient';
import facilitiesData from '@/data/facilities.json';

// 🔥 30초 캐시 (빠른 로딩)
export const revalidate = 30;

// 시설명 맵 (정적 JSON에서)
const facilityNameMap = new Map(
    (facilitiesData as any[]).map(f => [f.id, f.name])
);

interface Inquiry {
    id: string;
    facilityId: string;
    facilityName?: string;
    title: string;
    content: string;
    isPrivate: boolean;
    phone: string | null;
    type?: string;
    createdAt: string;
    replies?: { id: string; content: string; author: string; createdAt: string }[];
}

async function getInquiries(): Promise<Inquiry[]> {
    try {
        const supabase = getSupabaseServer();

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
            return [];
        }

        return (inquiries || []).map(inq => ({
            ...inq,
            facilityName: facilityNameMap.get(inq.facilityId) || inq.facilityId
        }));
    } catch (error) {
        console.error('Failed to load inquiries:', error);
        return [];
    }
}

export default async function InquiriesPage() {
    // 🚀 서버에서 미리 데이터 로드 (SSR)
    const inquiries = await getInquiries();

    const maskedInquiries = inquiries?.map(item => ({
        ...item,
        phone: item.phone ? item.phone.slice(0, 7) + '****' : null,
        content: item.isPrivate ? '비밀글입니다.' : item.content,
        title: item.isPrivate ? '비밀 문의' : item.title,
    })) || [];

    // 시설 목록 (상위 200개만 - 성능)
    const facilities = (facilitiesData as any[]).slice(0, 200).map(f => ({
        id: f.id,
        name: f.name
    }));

    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
            <InquiriesClient initialInquiries={maskedInquiries} facilities={facilities} />
        </Suspense>
    );
}
