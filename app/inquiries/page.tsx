import { createClient } from '@supabase/supabase-js';
import InquiriesClient from './InquiriesClient';

// 🔥 30초 캐시 (빠른 로딩)
export const revalidate = 30;

const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';

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

        return (inquiries || []).map(inq => ({
            ...inq,
            facilityName: facilityNameMap.get(inq.facilityId) || '시설'
        }));
    } catch (error) {
        console.error('Failed to load inquiries:', error);
        return [];
    }
}

export default async function InquiriesPage() {
    // 🚀 서버에서 미리 데이터 로드 (SSR)
    const initialInquiries = await getInquiries();

    return <InquiriesClient initialInquiries={initialInquiries} />;
}
