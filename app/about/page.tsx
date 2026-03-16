import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
    title: '회사소개 | 대대손손 - 전국 장지 가격 비교 전문 플랫폼',
    description:
        '왜 같은 봉안당인데 가격이 200만원부터 1,100만원까지인가요? 대대손손은 전국 1,495곳 장지의 가격을 투명하게 비교합니다. 봉안당, 수목장, 자연장, 공원묘지 등 6가지 시설 유형의 가격을 한눈에 확인하세요.',
    openGraph: {
        title: '회사소개 | 대대손손 - 전국 장지 가격 비교 전문 플랫폼',
        description:
            '전국 1,495곳 장지의 가격을 투명하게 비교합니다. 슬픔 속에서도 현명한 선택을 할 수 있도록.',
        type: 'website',
        url: 'https://daedaesonson.com/about',
        images: [
            {
                url: 'https://daedaesonson.com/og-image.png',
                width: 1200,
                height: 630,
                alt: '대대손손 - 전국 장지 가격 비교 플랫폼',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: '대대손손 - 전국 장지 가격 비교 전문 플랫폼',
        description: '전국 1,495곳 봉안당, 수목장, 공원묘지 가격을 한눈에 비교하세요.',
        images: ['https://daedaesonson.com/og-image.png'],
    },
    alternates: {
        canonical: 'https://daedaesonson.com/about',
    },
};

// Organization + WebPage JSON-LD
function AboutJsonLd() {
    const organizationSchema = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '대대손손',
        url: 'https://daedaesonson.com',
        logo: 'https://daedaesonson.com/logo-horizontal.svg',
        description: '전국 1,495곳 장지의 가격을 투명하게 비교하는 플랫폼',
        foundingDate: '2025',
        sameAs: [],
        contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer service',
            availableLanguage: 'Korean',
        },
        areaServed: {
            '@type': 'Country',
            name: 'KR',
        },
    };

    const webPageSchema = {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: '회사소개 | 대대손손',
        url: 'https://daedaesonson.com/about',
        description: '전국 1,495곳 장지의 가격을 투명하게 비교하는 플랫폼. 봉안당, 수목장, 자연장, 공원묘지 등 6가지 시설 유형의 가격을 한눈에 확인하세요.',
        isPartOf: {
            '@type': 'WebSite',
            name: '대대손손',
            url: 'https://daedaesonson.com',
        },
        about: {
            '@type': 'Organization',
            name: '대대손손',
        },
        breadcrumb: {
            '@type': 'BreadcrumbList',
            itemListElement: [
                {
                    '@type': 'ListItem',
                    position: 1,
                    name: '홈',
                    item: 'https://daedaesonson.com',
                },
                {
                    '@type': 'ListItem',
                    position: 2,
                    name: '회사소개',
                    item: 'https://daedaesonson.com/about',
                },
            ],
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }}
            />
        </>
    );
}

export default function AboutPage() {
    return (
        <>
            <AboutJsonLd />
            <AboutClient />
        </>
    );
}
