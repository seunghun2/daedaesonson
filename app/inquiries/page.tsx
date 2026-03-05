import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import InquiriesClient from './InquiriesClient';
import facilitiesData from '@/data/facilities.json';

// 🔥 30초 캐시 (빠른 로딩)
export const revalidate = 30;

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

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
    phone: string;
    type?: string;
    createdAt: string;
    replies?: { id: string; content: string; author: string; createdAt: string }[];
}

async function getInquiries(): Promise<Inquiry[]> {
    try {
        const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false }
        });

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
    const initialInquiries = await getInquiries();

    // 시설 목록 (상위 200개만 - 성능)
    const facilities = (facilitiesData as any[]).slice(0, 200).map(f => ({
        id: f.id,
        name: f.name
    }));

    return (
        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>로딩 중...</div>}>
            <InquiriesClient initialInquiries={initialInquiries} facilities={facilities} />
        </Suspense>
    );
}
