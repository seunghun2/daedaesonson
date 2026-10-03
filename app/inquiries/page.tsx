import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getSupabaseServer } from '@/lib/supabaseServer';
import InquiriesClient from './InquiriesClient';
import { loadFacilitiesJson } from '@/lib/facilityDataLoader';

export const metadata: Metadata = {
    title: '문의 | 대대손손',
    description: '시설에 대해 궁금한 점을 문의하세요. 대대손손 고객센터 및 시설 문의.',
    alternates: {
        canonical: '/inquiries',
    },
};

// 🔥 30초 캐시 (빠른 로딩)
export const revalidate = 30;

function getFacilityNameMap(): Map<string, string> {
    const list = loadFacilitiesJson();
    return new Map(list.map((f: any) => [f.id, f.name]));
}

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

        const nameMap = getFacilityNameMap();
        return (inquiries || []).map(inq => {
            const resolvedName = inq.facilityId ? nameMap.get(inq.facilityId) : null;
            const facilityName = (!inq.facilityId || inq.facilityId === 'general' || resolvedName === 'general')
                ? '일반'
                : (resolvedName || inq.facilityId || '일반');
            return {
                ...inq,
                facilityName,
            };
        });
    } catch (error) {
        console.error('Failed to load inquiries:', error);
        return [];
    }
}

export default async function InquiriesPage() {
    // 🚀 서버에서 미리 데이터 로드 (SSR)
    const inquiries = await getInquiries();

    const maskedInquiries = inquiries?.map(item => {
        const isPriv = Boolean(item.isPrivate);
        return {
            id: item.id,
            facilityId: item.facilityId,
            facilityName: item.facilityName || '일반',
            title: isPriv ? '비밀 문의' : item.title,
            content: isPriv ? '비밀글입니다.' : item.content,
            isPrivate: isPriv,
            phone: null,
            type: item.type || 'other',
            createdAt: item.createdAt,
            replies: isPriv ? [] : (item.replies || []),
        };
    }) || [];

    // 시설 목록 (상위 200개만 - 성능)
    const allFacilities = loadFacilitiesJson();
    const facilities = allFacilities.slice(0, 200).map((f: any) => ({
        id: f.id,
        name: f.name
    }));

    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
            <InquiriesClient initialInquiries={maskedInquiries} facilities={facilities} />
        </Suspense>
    );
}
