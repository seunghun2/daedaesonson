import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import fs from 'fs';
import path from 'path';
import Link from 'next/link';

// 지역-카테고리 조합 정의
const REGIONS = ['서울', '경기', '인천', '부산', '대구', '광주', '대전', '울산', '세종', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주'];
const CATEGORIES = [
    { slug: '봉안당', code: 'CHARNEL_HOUSE', label: '봉안당' },
    { slug: '수목장', code: 'NATURAL_BURIAL', label: '수목장' },
    { slug: '공원묘지', code: 'FAMILY_GRAVE', label: '공원묘지' },
];

interface PageProps {
    params: Promise<{ slug: string }>;
}

// 동적 메타데이터
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const [region, category] = slug.split('-');

    const categoryInfo = CATEGORIES.find(c => c.slug === category);
    if (!region || !categoryInfo) {
        return { title: '대대손손' };
    }

    const title = `${region} ${categoryInfo.label} 가격비교 | 대대손손`;
    const description = `${region} 지역 ${categoryInfo.label} 시설 가격을 비교해보세요. 최저가부터 시설 정보까지 한눈에!`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            url: `https://daedaesonson.com/지역/${slug}`,
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
    const [region, categorySlug] = slug.split('-');

    const categoryInfo = CATEGORIES.find(c => c.slug === categorySlug);
    if (!region || !categoryInfo || !REGIONS.includes(region)) {
        notFound();
    }

    // 시설 데이터 로드
    const dataPath = path.join(process.cwd(), 'data', 'facilities.json');
    const fileContent = fs.readFileSync(dataPath, 'utf-8');
    const allFacilities = JSON.parse(fileContent);

    // 해당 지역 + 카테고리 필터링
    const facilities = allFacilities.filter((f: any) => {
        const facRegion = extractRegion(f.address);
        return facRegion === region &&
            f.category === categoryInfo.code &&
            f.priceRange?.min > 0;
    });

    return (
        <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
            <header style={{ marginBottom: '30px' }}>
                <Link href="/" style={{ color: '#1D0098', textDecoration: 'none' }}>
                    ← 지도로 돌아가기
                </Link>
                <h1 style={{ margin: '20px 0 10px', fontSize: '28px', color: '#1a1a1a' }}>
                    {region} {categoryInfo.label} 가격비교
                </h1>
                <p style={{ color: '#666', fontSize: '16px' }}>
                    총 {facilities.length}개 시설
                </p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {facilities.map((f: any) => (
                    <Link
                        key={f.id}
                        href={`/facilities/${f.id}`}
                        style={{
                            display: 'block',
                            padding: '20px',
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'transform 0.2s, box-shadow 0.2s',
                        }}
                    >
                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#1a1a1a' }}>
                            {f.name}
                        </h3>
                        <p style={{ margin: '0 0 12px', fontSize: '14px', color: '#666' }}>
                            {f.address}
                        </p>
                        <div style={{
                            fontSize: '20px',
                            fontWeight: 'bold',
                            color: '#1D0098'
                        }}>
                            {f.priceRange?.min?.toLocaleString()}만 ~
                        </div>
                    </Link>
                ))}
            </div>

            {facilities.length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', padding: '40px' }}>
                    해당 지역에 {categoryInfo.label} 시설이 없습니다.
                </p>
            )}

            {/* SEO용 텍스트 */}
            <section style={{ marginTop: '60px', padding: '30px', backgroundColor: '#f8f9fa', borderRadius: '12px' }}>
                <h2 style={{ fontSize: '20px', marginBottom: '15px' }}>
                    {region} {categoryInfo.label} 안내
                </h2>
                <p style={{ color: '#555', lineHeight: '1.8' }}>
                    {region} 지역의 {categoryInfo.label} 시설을 찾고 계신가요?
                    대대손손에서는 {region} 지역 {facilities.length}개 {categoryInfo.label} 시설의
                    가격 정보를 투명하게 비교해드립니다.
                    각 시설의 상세 가격표, 위치, 연락처 정보를 확인하실 수 있습니다.
                </p>
            </section>
        </div>
    );
}
