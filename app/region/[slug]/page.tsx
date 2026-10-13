import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin } from 'lucide-react';
import { loadFacilitiesJson } from '@/lib/facilityDataLoader';

// 지역-카테고리 조합 정의
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const CATEGORIES = [
    { slug: '봉안당', code: 'CHARNEL_HOUSE', label: '봉안당', bg: '#EFF6FF', text: '#1D4ED8' },
    { slug: '수목장', code: 'NATURAL_BURIAL', label: '수목장', bg: '#ECFDF5', text: '#047857' },
    { slug: '공원묘지', code: 'FAMILY_GRAVE', label: '공원묘지', bg: '#F5F3FF', text: '#6D28D9' },
];

interface PageProps {
    params: Promise<{ slug: string }>;
}

function formatManwon(val: number | undefined): string {
    if (!val || val <= 0) return '가격문의';
    const manwon = val >= 10000 ? Math.round(val / 10000) : Math.round(val);
    return `${manwon.toLocaleString()}만원`;
}

// 동적 메타데이터
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const [region, category] = decodedSlug.split('-');

    const categoryInfo = CATEGORIES.find(c => c.slug === category);
    if (!region || !REGIONS.includes(region) || !categoryInfo) {
        notFound();
    }

    const title = `${region} ${categoryInfo.label} 가격비교 | 대대손손`;
    const description = `${region} 지역 ${categoryInfo.label} 시설 가격을 비교해보세요. 최저가부터 시설 정보까지 한눈에!`;

    return {
        title,
        description,
        alternates: {
            canonical: `/region/${slug}`,
        },
        openGraph: {
            title,
            description,
            url: `https://daedaesonson.com/region/${slug}`,
        },
    };
}

// 정적 경로 생성 (빌드 시)
export async function generateStaticParams() {
    const params: { slug: string }[] = [];

    for (const region of REGIONS) {
        for (const cat of CATEGORIES) {
            params.push({ slug: `${region}-${cat.slug}` });
        }
    }

    return params;
}

// 주소에서 지역 추출
function extractRegion(address: string): string | null {
    if (!address) return null;
    const first = address.split(' ')[0] || '';

    if (first.includes('서울')) return '서울';
    if (first.includes('부산')) return '부산';
    if (first.includes('대구')) return '대구';
    if (first.includes('인천')) return '인천';
    if (first.includes('광주') && !first.includes('경기')) return '광주';
    if (first.includes('대전')) return '대전';
    if (first.includes('울산')) return '울산';
    if (first.includes('세종')) return '세종';
    if (first.includes('경기')) return '경기';
    if (first.includes('강원')) return '강원';
    if (first.includes('충청북') || first.includes('충북')) return '충북';
    if (first.includes('충청남') || first.includes('충남')) return '충남';
    if (first.includes('전라북') || first.includes('전북')) return '전북';
    if (first.includes('전라남') || first.includes('전남')) return '전남';
    if (first.includes('경상북') || first.includes('경북')) return '경북';
    if (first.includes('경상남') || first.includes('경남')) return '경남';
    if (first.includes('제주')) return '제주';

    return null;
}

export default async function RegionPage({ params }: PageProps) {
    const { slug } = await params;
    const decodedSlug = decodeURIComponent(slug);
    const [region, categorySlug] = decodedSlug.split('-');

    const categoryInfo = CATEGORIES.find(c => c.slug === categorySlug);
    if (!region || !categoryInfo || !REGIONS.includes(region)) {
        notFound();
    }

    // 시설 데이터 로드 (캐시)
    const allFacilities = loadFacilitiesJson();

    // 해당 지역 + 카테고리 필터링
    const facilities = allFacilities.filter((f: any) => {
        if (f.isActive === false || f.category === 'FUNERAL_HOME') return false;
        const facRegion = extractRegion(f.address);
        return facRegion === region &&
            f.category === categoryInfo.code &&
            f.priceRange?.min > 0;
    });

    return (
        <div style={{ minHeight: '100dvh', backgroundColor: '#F2F4F6' }}>
            {/* 클린 상단 네비게이션 바 */}
            <nav
                style={{
                    position: 'sticky',
                    top: 0,
                    zIndex: 100,
                    backgroundColor: '#FFFFFF',
                    borderBottom: '1px solid #E5E8EB',
                    padding: '12px 20px',
                }}
            >
                <div style={{ maxWidth: '1080px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Link
                        href="/"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: '#191F28',
                            textDecoration: 'none',
                            fontSize: '14px',
                            fontWeight: 600,
                        }}
                    >
                        <ChevronLeft size={20} color="#191F28" />
                        <span>지도로 돌아가기</span>
                    </Link>
                    <span
                        style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            color: categoryInfo.text,
                            backgroundColor: categoryInfo.bg,
                            padding: '4px 10px',
                            borderRadius: '999px',
                        }}
                    >
                        {region} · {categoryInfo.label}
                    </span>
                </div>
            </nav>

            <main style={{ padding: '28px 20px 60px', maxWidth: '1080px', margin: '0 auto' }}>
                <header style={{ marginBottom: '24px' }}>
                    <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 800, color: '#191F28', letterSpacing: '-0.5px' }}>
                        {region} {categoryInfo.label} 가격비교
                    </h1>
                    <p style={{ margin: 0, color: '#6B7684', fontSize: '15px', fontWeight: 500 }}>
                        총 <strong style={{ color: '#2563EB', fontWeight: 700 }}>{facilities.length}개</strong> 시설의 가격 정보를 비교해보세요
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {facilities.map((f: any) => (
                        <Link
                            key={f.id}
                            href={`/facility/${f.id}`}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'space-between',
                                padding: '20px',
                                backgroundColor: '#FFFFFF',
                                borderRadius: '16px',
                                border: '1px solid rgba(15, 23, 42, 0.06)',
                                textDecoration: 'none',
                                color: 'inherit',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: categoryInfo.bg,
                                            color: categoryInfo.text,
                                        }}
                                    >
                                        {categoryInfo.label}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: '11px',
                                            fontWeight: 600,
                                            padding: '3px 8px',
                                            borderRadius: '6px',
                                            backgroundColor: f.isPublic ? '#EFF6FF' : '#F2F4F6',
                                            color: f.isPublic ? '#2563EB' : '#4E5968',
                                        }}
                                    >
                                        {f.isPublic ? '공설' : '사설'}
                                    </span>
                                </div>

                                <h3 style={{ margin: '0 0 6px', fontSize: '17px', fontWeight: 700, color: '#191F28', letterSpacing: '-0.3px' }}>
                                    {f.name}
                                </h3>
                                <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6B7684', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={13} color="#8B95A1" style={{ flexShrink: 0 }} />
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.address}</span>
                                </p>
                            </div>

                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'baseline',
                                    justifyContent: 'space-between',
                                    paddingTop: '12px',
                                    borderTop: '1px solid #F2F4F6',
                                }}
                            >
                                <span style={{ fontSize: '12px', fontWeight: 600, color: '#8B95A1' }}>대표가격</span>
                                <span style={{ fontSize: '19px', fontWeight: 800, color: '#2563EB', letterSpacing: '-0.4px' }}>
                                    {formatManwon(f.priceRange?.min)}~
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>

                {facilities.length === 0 && (
                    <div style={{ textAlign: 'center', color: '#8B95A1', padding: '60px 20px', backgroundColor: '#FFFFFF', borderRadius: '16px' }}>
                        해당 지역에 {categoryInfo.label} 시설이 없습니다.
                    </div>
                )}

                {/* SEO용 텍스트 */}
                <section
                    style={{
                        marginTop: '48px',
                        padding: '28px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid rgba(15, 23, 42, 0.06)',
                    }}
                >
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#191F28', margin: '0 0 12px' }}>
                        {region} {categoryInfo.label} 안내
                    </h2>
                    <p style={{ color: '#4E5968', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>
                        {region} 지역의 {categoryInfo.label} 시설을 찾고 계신가요?
                        대대손손에서는 {region} 지역 {facilities.length}개 {categoryInfo.label} 시설의
                        가격 정보를 투명하게 비교해드립니다.
                        각 시설의 상세 가격표, 위치, 연락처 정보를 확인하실 수 있습니다.
                    </p>
                </section>
            </main>
        </div>
    );
}
