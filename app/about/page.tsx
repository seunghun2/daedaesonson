import type { Metadata } from 'next';
import AboutClient from './AboutClient';

export const metadata: Metadata = {
    title: '회사소개 | 대대손손 - 전국 장지 조회 1등 플랫폼',
    description:
        '왜 같은 봉안당인데 가격이 200만원부터 1,100만원까지인가요? 대대손손은 전국 1,495곳 장지의 가격을 투명하게 비교합니다. 봉안당, 수목장, 자연장, 공원묘지 등 6가지 시설 유형의 가격을 한눈에 확인하세요.',
    openGraph: {
        title: '회사소개 | 대대손손 - 전국 장지 조회 1등 플랫폼',
        description:
            '전국 1,495곳 장지의 가격을 투명하게 비교합니다. 슬픔 속에서도 현명한 선택을 할 수 있도록.',
        type: 'website',
    },
};

export default function AboutPage() {
    return <AboutClient />;
}
