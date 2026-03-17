import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

const CATEGORY_MAP: Record<string, { code: string; label: string }> = {
    '봉안당': { code: 'CHARNEL_HOUSE', label: '봉안당' },
    '수목장': { code: 'NATURAL_BURIAL', label: '수목장' },
    '공원묘지': { code: 'FAMILY_GRAVE', label: '공원묘지' },
};

interface PageProps {
    params: Promise<{ city: string; category: string }>;
}

// 시설 데이터 로드 (캐시)
function loadFacilities() {
    const dataPath = path.join(process.cwd(), 'data', 'facilities.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    return JSON.parse(fileContent);
}

// 동적 메타데이터
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { city, category } = await params;
    const categoryInfo = CATEGORY_MAP[category];

    if (!categoryInfo) {
        return { title: '대대손손' };
    }

    const title = `${city} ${categoryInfo.label} 가격비교 | 대대손손`;
    const description = `${city} 지역 ${categoryInfo.label} 시설 가격을 비교해보세요. 최저가부터 시설 정보까지 한눈에 확인!`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://daedaesonson.com/search/${city}/${category}`,
        },
    };
}

// 정적 경로 생성
export async function generateStaticParams() {
    const facilities = loadFacilities();
    const combos = new Map<string, number>();

    facilities.forEach((f: any) => {
        if (!f.address || !f.category) return;
        if (f.category === 'FUNERAL_HOME') return;
        if (!f.priceRange?.min || f.priceRange.min <= 0) return;

        const tokens = f.address.split(' ');
        const city = tokens[1];
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
    const categoryInfo = CATEGORY_MAP[category];

    if (!categoryInfo) {
        notFound();
    }

    const allFacilities = loadFacilities();

    // 해당 시/군 + 카테고리 필터링
    const facilities = allFacilities.filter((f: any) => {
        if (!f.address) return false;
        const tokens = f.address.split(' ');
        return tokens[1] === city &&
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
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
            <header style={{ marginBottom: '30px' }}>
                <Link href="/" style={{ color: '#1D0098', textDecoration: 'none', fontSize: '14px' }}>
                    ← 지도로 돌아가기
                </Link>
                <h1 style={{ margin: '20px 0 10px', fontSize: '28px', color: '#1a1a1a' }}>
                    {city} {categoryInfo.label} 가격비교
                </h1>
                <p style={{ color: '#666', fontSize: '16px', margin: '0' }}>
                    <strong>{facilities.length}개</strong> 시설 |
                    최저 <strong style={{ color: '#1D0098' }}>{minPrice.toLocaleString()}만원</strong> ~
                    최고 {maxPrice.toLocaleString()}만원
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                {facilities.sort((a: any, b: any) => (a.priceRange?.min || 0) - (b.priceRange?.min || 0)).map((f: any) => (
                    <Link
                        key={f.id}
                        href={`/facility/${f.id}`}
                        style={{
                            display: 'block',
                            padding: '20px',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                            textDecoration: 'none',
                            color: 'inherit',
                        }}
                    >
                        <h3 style={{ margin: '0 0 8px', fontSize: '17px', color: '#1a1a1a' }}>
                            {f.name}
                        </h3>
                        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#888' }}>
                            {f.address}
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1D0098' }}>
                                {f.priceRange?.min?.toLocaleString()}만원~
                            </span>
                            <span style={{ fontSize: '12px', color: '#aaa' }}>
                                {f.isPublic ? '공설' : '사설'}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>

            {/* SEO 콘텐츠 */}
            <section style={{ marginTop: '50px', padding: '30px', backgroundColor: '#fff', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px', color: '#1a1a1a' }}>
                    {city} {categoryInfo.label} 시설 안내
                </h2>
                <p style={{ color: '#555', lineHeight: '1.8', margin: '0' }}>
                    {city} 지역에서 {categoryInfo.label} 시설을 찾고 계신가요?
                    대대손손에서 {city} 지역 {facilities.length}개 {categoryInfo.label} 시설의
                    가격 정보를 투명하게 비교해드립니다.
                    최저가 {minPrice.toLocaleString()}만원부터 다양한 가격대의 시설이 있으며,
                    각 시설의 상세 가격표, 위치, 연락처 정보를 확인하실 수 있습니다.
                </p>
            </section>
        </div>
    );
}
