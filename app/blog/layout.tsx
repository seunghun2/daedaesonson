import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '대대손손 블로그 — 장지·봉안당·수목장 가이드',
    description: '봉안당, 수목장, 공원묘지 비용 비교부터 장례 절차, 시설 리뷰까지. 장지 선택에 필요한 모든 정보를 대대손손 블로그에서 확인하세요.',
    keywords: ['봉안당 가이드', '수목장 가이드', '장지 비용', '장례 절차', '시설 리뷰', '봉안당 가격', '수목장 가격'],
    openGraph: {
        title: '대대손손 블로그 — 장지·봉안당·수목장 가이드',
        description: '봉안당, 수목장, 공원묘지 비용 비교부터 장례 절차, 시설 리뷰까지.',
        url: 'https://daedaesonson.com/blog',
        siteName: '대대손손',
        locale: 'ko_KR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: '대대손손 블로그 — 장지·봉안당·수목장 가이드',
        description: '봉안당, 수목장, 공원묘지 비용 비교부터 장례 절차, 시설 리뷰까지.',
    },
    alternates: {
        canonical: '/blog',
    },
};

export default function GuideLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
