import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '대대손손 - 전국 장지비교 플랫폼',
  description: '전국 1,500여개 봉안당, 수목장, 공원묘지 가격을 한눈에 비교하세요. 지역별 최저가 시설을 쉽게 찾아보세요.',
  keywords: ['봉안당', '수목장', '공원묘지', '장묘시설', '납골당', '자연장', '봉안시설 가격', '추모공원'],
  referrer: 'origin',
  metadataBase: new URL('https://daedaesonson.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '대대손손 - 전국 장지비교 플랫폼',
    description: '전국 1,500여개 봉안당, 수목장, 공원묘지 가격을 한눈에 비교하세요.',
    url: 'https://daedaesonson.com',
    siteName: '대대손손',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '대대손손 - 전국 장지비교 플랫폼',
    description: '전국 1,500여개 봉안당, 수목장, 공원묘지 가격을 한눈에 비교하세요.',
  },
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
  verification: {
    google: 'x6XjVw34T66ZPgblW66kZmrgaujSCCr2TMJXUYp8_Mk',
    // other: { 'naver-site-verification': '' }, // 네이버 웹마스터 인증 코드
  },
};

const theme = createTheme({
  colors: {
    // 사용자 요청 Deep Blue/Indigo (758만원 텍스트 컬러 기반)
    brand: [
      '#eef2ff', // 0: 아주 연한 배경
      '#dbe4ff', // 1
      '#bac8ff', // 2
      '#91a7ff', // 3
      '#748aff', // 4
      '#5c7cfa', // 5: 밝은 포인트 (헤더 등)
      '#4263eb', // 6: 기본 버튼
      '#364fc7', // 7: 강조
      '#302E92', // 8: 텍스트/가장 진한 포인트 (이미지 컬러)
      '#1e1b69'  // 9: 아주 어두운 배경
    ],
  },
  primaryColor: 'brand',
  primaryShade: 8, // 메인 컬러를 8번(진한 남색)으로 설정하여 무게감 줌
  fontFamily: inter.style.fontFamily,
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <ColorSchemeScript />
        {/* JSON-LD 구조화 데이터 (검색 엔진 최적화) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: '대대손손',
              url: 'https://daedaesonson.com',
              description: '전국 봉안당, 수목장, 공원묘지 가격비교 플랫폼',
              potentialAction: {
                '@type': 'SearchAction',
                target: 'https://daedaesonson.com/list?q={search_term_string}',
                'query-input': 'required name=search_term_string',
              },
            }),
          }}
        />
        {/* 🚫 모바일 더블탭 확대 완전 차단 */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        {/* Google Material Symbols Outlined */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        {/* 네이버 지도 API 스크립트 (클라이언트 ID는 환경변수에서 로드) */}
        {/* 실제 운영 시에는 strategy="beforeInteractive" 등을 고려 */}
        {/* 🚫 더블탭/dblclick 이벤트 기본 동작 차단 스크립트 */}
        <script dangerouslySetInnerHTML={{
          __html: `
          (function() {
            var lastTouchEnd = 0;
            // touchend 기반 더블탭 감지 및 차단 (iOS Safari / Android WebView)
            document.addEventListener('touchend', function(e) {
              var now = Date.now();
              if (now - lastTouchEnd <= 300) {
                e.preventDefault();
              }
              lastTouchEnd = now;
            }, { passive: false });
            
            // dblclick 이벤트 기본 동작 방지
            document.addEventListener('dblclick', function(e) {
              e.preventDefault();
            }, { passive: false });
          })();
        ` }} />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
