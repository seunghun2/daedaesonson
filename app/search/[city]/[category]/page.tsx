import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, MapPin } from 'lucide-react';
import { loadFacilitiesJson as loadFacilities } from '@/lib/facilityDataLoader';

const CATEGORY_MAP: Record<string, { code: string; label: string; bg: string; text: string }> = {
    '봉안당': { code: 'CHARNEL_HOUSE', label: '봉안당', bg: '#F2F4F6', text: '#4E5968' },
    '수목장': { code: 'NATURAL_BURIAL', label: '수목장', bg: '#F2F4F6', text: '#4E5968' },
    '공원묘지': { code: 'FAMILY_GRAVE', label: '공원묘지', bg: '#F2F4F6', text: '#4E5968' },
};

interface PageProps {
    params: Promise<{ city: string; category: string }>;
}

const HOMONYMOUS_DISTRICTS = new Set(['중구', '남구', '동구', '서구', '북구', '강서구', '고성군']);
const SHORT_PROVINCE_MAP: Record<string, string> = {
    '서울특별시': '서울', '부산광역시': '부산', '대구광역시': '대구', '인천광역시': '인천',
    '광주광역시': '광주', '대전광역시': '대전', '울산광역시': '울산', '세종특별자치시': '세종',
    '경기도': '경기', '강원특별자치도': '강원', '강원도': '강원',
    '충청북도': '충북', '충청남도': '충남',
    '전북특별자치도': '전북', '전라북도': '전북', '전라남도': '전남',
    '경상북도': '경북', '경상남도': '경남', '제주특별자치도': '제주',
};

function formatManwon(val: number | undefined): string {
    if (!val || val <= 0 || !Number.isFinite(val)) return '가격문의';
    const manwon = val >= 10000 ? Math.round(val / 10000) : Math.round(val);
    return `${manwon.toLocaleString()}만원`;
}

function getCityKeyFromAddress(address: string): string | null {
    const tokens = address.trim().split(/\s+/);
    const prov = tokens[0];
    const city = tokens[1];
    if (!prov || !city) return null;
    if (HOMONYMOUS_DISTRICTS.has(city)) {
        const shortProv = SHORT_PROVINCE_MAP[prov] || prov.slice(0, 2);
        return `${shortProv} ${city}`;
    }
    return city;
}

// 동적 메타데이터
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city, category } = await params;
    const decodedCity = decodeURIComponent(city);
    const decodedCategory = decodeURIComponent(category);
    const categoryInfo = CATEGORY_MAP[decodedCategory];

    if (!categoryInfo) {
        notFound();
    }

    const allFacilities = loadFacilities();
    const hasMatch = allFacilities.some((f: any) => {
        if (!f.address || f.isActive === false) return false;
        const tokens = f.address.trim().split(/\s+/);
        const cityKey = getCityKeyFromAddress(f.address);
        return (cityKey === decodedCity || tokens[1] === decodedCity) &&
            f.category === categoryInfo.code &&
            f.priceRange?.min > 0;
    });

    if (!hasMatch) {
        notFound();
    }

    const title = `${decodedCity} ${categoryInfo.label} 가격비교 | 대대손손`;
    const description = `${decodedCity} 지역 ${categoryInfo.label} 시설 가격을 비교해보세요. 최저가부터 시설 정보까지 한눈에 확인!`;

    return {
        title,
        description,
        alternates: {
            canonical: `/search/${city}/${category}`,
        },
        openGraph: {
            title,
            description,
            url: `https://daedaesonson.com/search/${decodedCity}/${decodedCategory}`,
        },
    };
}

// 정적 경로 생성
export async function generateStaticParams() {
    const facilities = loadFacilities();
    const combos = new Map<string, number>();

    facilities.forEach((f: any) => {
        if (!f.address || !f.category) return;
        if (f.category === 'FUNERAL_HOME' || f.isActive === false) return;
        if (!f.priceRange?.min || f.priceRange.min <= 0) return;

        const city = getCityKeyFromAddress(f.address);
        if (!city) return;

        // 카테고리 코드 → 슬러그
        let catSlug = '';
        if (f.category === 'CHARNEL_HOUSE') catSlug = '봉안당';
        else if (f.category === 'NATURAL_BURIAL') catSlug = '수목장';
        else if (f.category === 'FAMILY_GRAVE') catSlug = '공원묘지';
        else return;

        const key = `${city}|${catSlug}`;
        combos.set(key, (combos.get(key) || 0) + 1);
    });

    // 시설 2개 이상인 조합만
    const params: { city: string; category: string }[] = [];
    combos.forEach((count, key) => {
        if (count >= 2) {
            const [city, category] = key.split('|');
            params.push({ city, category });
        }
    });

    return params;
}

export default async function CityPage({ params }: PageProps) {
    const { city, category } = await params;
    const decodedCity = decodeURIComponent(city);
    const decodedCategory = decodeURIComponent(category);
    const categoryInfo = CATEGORY_MAP[decodedCategory];

    if (!categoryInfo) {
        notFound();
    }

    const allFacilities = loadFacilities();

    // 해당 시/군 + 카테고리 필터링 (광역 구 동명이구 및 기존 단일 구 슬러그 하위호환 지원)
    const facilities = allFacilities.filter((f: any) => {
        if (!f.address || f.isActive === false) return false;
        const tokens = f.address.trim().split(/\s+/);
        const cityKey = getCityKeyFromAddress(f.address);
        const matchesCity = cityKey === decodedCity || tokens[1] === decodedCity;
        return matchesCity &&
            f.category === categoryInfo.code &&
            f.priceRange?.min > 0;
    });

    if (facilities.length === 0) {
        notFound();
    }

    // 최저가/최고가
    const minPrice = Math.min(...facilities.map((f: any) => f.priceRange?.min || Infinity));
    const maxPrice = Math.max(...facilities.map((f: any) => f.priceRange?.max || 0));

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
                        {decodedCity} · {categoryInfo.label}
                    </span>
                </div>
            </nav>

            <main style={{ padding: '28px 20px 60px', maxWidth: '1080px', margin: '0 auto' }}>
                <header style={{ marginBottom: '24px' }}>
                    <h1 style={{ margin: '0 0 8px', fontSize: '26px', fontWeight: 800, color: '#191F28', letterSpacing: '-0.5px' }}>
                        {decodedCity} {categoryInfo.label} 가격비교
                    </h1>
                    <p style={{ color: '#6B7684', fontSize: '15px', margin: 0, fontWeight: 500 }}>
                        총 <strong style={{ color: '#191F28', fontWeight: 700 }}>{facilities.length}개</strong> 시설 · 최저{' '}
                        <strong style={{ color: '#191F28', fontWeight: 700 }}>{formatManwon(minPrice)}</strong>
                        {maxPrice > 0 ? ` ~ 최고 ${formatManwon(maxPrice)}` : ''}
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                    {facilities
                        .sort((a: any, b: any) => (a.priceRange?.min || 0) - (b.priceRange?.min || 0))
                        .map((f: any) => (
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
                                                backgroundColor: '#F2F4F6',
                                                color: '#4E5968',
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
                                        justifyContent: 'space-between',
                                        alignItems: 'baseline',
                                        paddingTop: '12px',
                                        borderTop: '1px solid #F2F4F6',
                                    }}
                                >
                                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#8B95A1' }}>대표가격</span>
                                    <span style={{ fontSize: '19px', fontWeight: 800, color: '#191F28', letterSpacing: '-0.4px' }}>
                                        {formatManwon(f.priceRange?.min)}~
                                    </span>
                                </div>
                            </Link>
                        ))}
                </div>

                {/* SEO 콘텐츠 */}
                <section
                    style={{
                        marginTop: '48px',
                        padding: '28px',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: '1px solid rgba(15, 23, 42, 0.06)',
                    }}
                >
                    <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px', color: '#191F28' }}>
                        {decodedCity} {categoryInfo.label} 시설 안내
                    </h2>
                    <p style={{ color: '#4E5968', fontSize: '14px', lineHeight: '1.75', margin: 0 }}>
                        {decodedCity} 지역에서 {categoryInfo.label} 시설을 찾고 계신가요?
                        대대손손에서 {decodedCity} 지역 {facilities.length}개 {categoryInfo.label} 시설의
                        가격 정보를 투명하게 비교해드립니다.
                        최저가 {formatManwon(minPrice)}부터 다양한 가격대의 시설이 있으며,
                        각 시설의 상세 가격표, 위치, 연락처 정보를 확인하실 수 있습니다.
                    </p>
                </section>
            </main>
        </div>
    );
}
