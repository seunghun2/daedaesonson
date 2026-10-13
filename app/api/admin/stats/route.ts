import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabaseServer';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const authError = await requireAdmin();
    if (authError) return authError;

    try {
        const supabase = getSupabaseServer();

        const [
            { count: totalFacilities },
            { count: membersCount },
            { count: consultsCount },
            { count: inquiriesCount },
            { count: reviewsCount },
            { count: correctionsCount },
            { count: partnershipCount },
            { count: consultsPending },
            { data: inquiriesWithReplies },
            { count: correctionsPending },
            { count: partnershipPending },
            facilityPage0,
            facilityPage1,
        ] = await Promise.all([
            supabase.from('Facility').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('Consult').select('*', { count: 'exact', head: true }),
            supabase.from('Inquiry').select('*', { count: 'exact', head: true }),
            supabase.from('Review').select('*', { count: 'exact', head: true }),
            supabase.from('facility_corrections').select('*', { count: 'exact', head: true }),
            supabase.from('partnership_inquiries').select('*', { count: 'exact', head: true }),
            supabase.from('Consult').select('*', { count: 'exact', head: true }).or('status.eq.pending,status.is.null'),
            supabase.from('Inquiry').select('id, replies:InquiryReply(id)').limit(1000),
            supabase.from('facility_corrections').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('partnership_inquiries').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('Facility').select('*').order('id', { ascending: true }).range(0, 999),
            supabase.from('Facility').select('*').order('id', { ascending: true }).range(1000, 1999),
        ]);

        const allFacilities: any[] = [
            ...(facilityPage0.data || []),
            ...(facilityPage1.data || []),
        ];

        const categoryCounts: Record<string, number> = {};
        allFacilities.forEach((f: any) => {
            if (f.category) {
                categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
            }
        });

        // updatedAt 기준 안전 정렬 후 상위 5개 추출
        const recentFacilities = [...allFacilities]
            .sort((a, b) => {
                const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
                const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
                return (Number.isFinite(timeB) ? timeB : 0) - (Number.isFinite(timeA) ? timeA : 0);
            })
            .slice(0, 5)
            .map((f) => ({
                id: f.id,
                name: f.name,
                category: f.category,
                rating: f.rating ?? 0,
                updatedAt: f.updatedAt || null,
            }));

        const inquiriesUnanswered = (inquiriesWithReplies || []).filter(
            (inq: any) => !Array.isArray(inq.replies) || inq.replies.length === 0
        ).length;

        // 데이터 무결성 지표 계산
        let activeFacilities = 0;
        let missingPriceCount = 0;
        let missingPhoneCount = 0;
        let missingImageCount = 0;
        let priceInversionCount = 0;
        let unreviewedCount = 0;
        let totalCompletenessScore = 0;

        const issueCandidates: Array<{
            priority: number;
            id: string;
            name: string;
            category: string;
            issueType: string;
            detail: string;
        }> = [];

        const getImageCount = (f: any): number => {
            if (Array.isArray(f.images)) return f.images.length;
            if (typeof f.images === 'string' && f.images.trim()) {
                try {
                    const parsed = JSON.parse(f.images);
                    if (Array.isArray(parsed)) return parsed.length;
                } catch {
                    return f.images.split(',').map((s: string) => s.trim()).filter(Boolean).length;
                }
            }
            if (f.thumbnail && String(f.thumbnail).trim()) return 1;
            return 0;
        };

        const isFacilityReviewed = (f: any): boolean => {
            if (f.isReviewed === true) return true;
            if (f.pricing) {
                if (typeof f.pricing === 'string') {
                    return (
                        f.pricing.includes('"priceVerified":true') ||
                        f.pricing.includes('"priceVerified": true') ||
                        f.pricing.includes('"isReviewed":true')
                    );
                }
                if (typeof f.pricing === 'object') {
                    return f.pricing.priceVerified === true || f.pricing.isReviewed === true;
                }
            }
            return false;
        };

        for (const f of allFacilities) {
            const isActive = f.isActive !== false;
            const repPrice = Number(f.representativePrice) || 0;
            const minPrice = Number(f.minPrice) || 0;
            const maxPrice = Number(f.maxPrice) || 0;
            const effectivePrice = repPrice > 0 ? repPrice : minPrice;
            const phone = String(f.phone || '').trim();
            const imgCount = getImageCount(f);
            const reviewed = isFacilityReviewed(f);
            const hasDescOrWeb = Boolean(
                (f.description && String(f.description).trim().length > 0) ||
                (f.websiteUrl && String(f.websiteUrl).trim().length > 0)
            );

            if (minPrice > 0 && maxPrice > 0 && minPrice > maxPrice) {
                priceInversionCount++;
            }

            if (!reviewed) {
                unreviewedCount++;
            }

            if (!isActive) continue;

            activeFacilities++;

            const hasPrice = repPrice > 0 || minPrice > 0;
            const hasValidPhone = phone.length >= 5 && /^[0-9\-+\s()]+$/.test(phone);
            const hasImage = imgCount > 0;

            if (!hasPrice) missingPriceCount++;
            if (phone.length < 5) missingPhoneCount++;
            if (!hasImage) missingImageCount++;

            let score = 0;
            if (hasPrice) score += 35;
            if (hasImage) score += 25;
            if (hasValidPhone) score += 20;
            if (hasDescOrWeb) score += 10;
            if (reviewed) score += 10;
            totalCompletenessScore += score;

            if (minPrice > 0 && maxPrice > 0 && minPrice > maxPrice) {
                issueCandidates.push({
                    priority: 1,
                    id: f.id,
                    name: f.name,
                    category: f.category,
                    issueType: '가격 역전',
                    detail: `최소가(${minPrice.toLocaleString()}원) > 최대가(${maxPrice.toLocaleString()}원)`,
                });
            } else if (effectivePrice > 100000000 || (effectivePrice >= 1 && effectivePrice <= 999)) {
                issueCandidates.push({
                    priority: 2,
                    id: f.id,
                    name: f.name,
                    category: f.category,
                    issueType: '대표가격 이상치',
                    detail: `대표가격 ${effectivePrice.toLocaleString()}원 단위 점검 필요`,
                });
            } else if (!hasValidPhone) {
                issueCandidates.push({
                    priority: 3,
                    id: f.id,
                    name: f.name,
                    category: f.category,
                    issueType: '전화번호 불량',
                    detail: phone ? `형식 오류 (${phone})` : '전화번호 미입력',
                });
            } else if (!hasImage) {
                issueCandidates.push({
                    priority: 4,
                    id: f.id,
                    name: f.name,
                    category: f.category,
                    issueType: '이미지 누락',
                    detail: '등록된 시설 이미지 0장',
                });
            }
        }

        issueCandidates.sort((a, b) => a.priority - b.priority);
        const issueFacilities = issueCandidates.slice(0, 10).map(({ id, name, category, issueType, detail }) => ({
            id,
            name,
            category,
            issueType,
            detail,
        }));

        const avgCompletenessScore = activeFacilities > 0
            ? Math.round((totalCompletenessScore / activeFacilities) * 10) / 10
            : 0;

        return NextResponse.json({
            stats: {
                totalFacilities: totalFacilities || 0,
                membersCount: membersCount || 0,
                consultsCount: consultsCount || 0,
                inquiriesCount: inquiriesCount || 0,
                reviewsCount: reviewsCount || 0,
                correctionsCount: correctionsCount || 0,
                partnershipCount: partnershipCount || 0,
            },
            pendingCounts: {
                consultsPending: consultsPending || 0,
                inquiriesUnanswered,
                correctionsPending: correctionsPending || 0,
                partnershipPending: partnershipPending || 0,
            },
            dataIntegrity: {
                activeFacilities,
                missingPriceCount,
                missingPhoneCount,
                missingImageCount,
                priceInversionCount,
                unreviewedCount,
                avgCompletenessScore,
                issueFacilities,
            },
            categoryCounts,
            recentFacilities,
        }, {
            headers: {
                'Cache-Control': 'private, s-maxage=10, stale-while-revalidate=30'
            }
        });
    } catch (e: any) {
        console.error('Admin stats error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
