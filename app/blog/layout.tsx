import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: '장지·봉안당·수목장·묘지이장 실전 가이드 | 대대손손 블로그',
    description: '전국 1,495곳 데이터로 분석한 봉안당·수목장·공원묘지 실제 가격 비교, 공설 봉안당 자격 요건, 묘지 개장·이장 비용과 절차, 현장 답사 체크리스트까지 한눈에 확인하세요.',
    keywords: [
        '봉안당 가격', '수목장 비용', '묘지 이장 비용', '개장신고 절차',
        '공설 봉안당 자격', '사설 봉안당 비교', '납골당 가격 비교',
        '장지 답사 체크리스트', '가족봉안묘 비용', '장례 절차 가이드',
    ],
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    openGraph: {
        title: '장지·봉안당·수목장·묘지이장 실전 가이드 | 대대손손 블로그',
        description: '전국 1,495곳 데이터로 분석한 봉안당·수목장 가격 비교, 묘지 이장 절차와 비용, 공설·사설 비교 가이드.',
        url: 'https://daedaesonson.com/blog',
        siteName: '대대손손',
        locale: 'ko_KR',
        type: 'website',
        images: [
            {
                url: 'https://daedaesonson.com/blog/blog12_thumbnail.png',
                width: 1024,
                height: 1024,
                alt: '대대손손 장지·봉안당·수목장 가이드',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '장지·봉안당·수목장·묘지이장 실전 가이드 | 대대손손 블로그',
        description: '전국 1,495곳 데이터로 분석한 봉안당·수목장 가격 비교, 묘지 이장 절차와 비용, 공설·사설 비교 가이드.',
        images: ['https://daedaesonson.com/blog/blog12_thumbnail.png'],
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
