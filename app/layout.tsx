import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Script from 'next/script';
import { AuthProvider } from '@/components/auth/AuthProvider';
import './globals.css';
import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '대대손손 - 전국 장지 조회 1등 플랫폼',
  description: '전국 1,500여개 봉안당, 수목장, 공원묘지 가격을 한눈에 비교하세요. 지역별 최저가 시설을 쉽게 찾아보세요.',
  keywords: ['봉안당', '수목장', '공원묘지', '장묘시설', '납골당', '자연장', '봉안시설 가격', '추모공원'],
  referrer: 'origin',
  metadataBase: new URL('https://daedaesonson.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: '대대손손 - 전국 장지 조회 1등 플랫폼',
    description: '전국 1,500여개 봉안당, 수목장, 공원묘지 가격을 한눈에 비교하세요.',
    url: 'https://daedaesonson.com',
    siteName: '대대손손',
    locale: 'ko_KR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: '대대손손 - 전국 장지 조회 1등 플랫폼',
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
    other: { 'naver-site-verification': '15a97c3ef5f7f80107149be1ee4ddb21214ed4c3' },
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
        {/* 🚫 iOS Safari 전화번호/주소 자동링크 비활성화 */}
        <meta name="format-detection" content="telephone=no, address=no, date=no" />
        {/* 🚀 Google Material Symbols - 필수 아이콘만 로드 + display=swap */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=swap"
        />
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme}>
          <AuthProvider>
            {children}
          </AuthProvider>
        </MantineProvider>
        {/* 🚀 GA4: afterInteractive로 변경 → 렌더 차단 제거 */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-XHCFVSDRDY"
        />
        <Script
          id="ga4-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-XHCFVSDRDY');
            `,
          }}
        />
        {/* 📊 Microsoft Clarity: 사용자 행동 분석 */}
        <Script
          id="clarity-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(c,l,a,r,i,t,y){
                c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
                t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
                y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
              })(window, document, "clarity", "script", "vsfs39zhhi");
            `,
          }}
        />
        {/* 🚀 더블탭 차단: afterInteractive로 이동 */}
        <Script
          id="prevent-doubletap"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              var lastTouchEnd = 0;
              document.addEventListener('touchend', function(e) {
                var now = Date.now();
                if (now - lastTouchEnd <= 300) {
                  e.preventDefault();
                }
                lastTouchEnd = now;
              }, { passive: false });
              document.addEventListener('dblclick', function(e) {
                e.preventDefault();
              }, { passive: false });
            })()
          `,
          }}
        />
        {/* 🔤 Material Symbols 폰트 로드 감지 */}
        <Script
          id="font-load-detect"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              if (document.fonts) {
                document.fonts.ready.then(function() {
                  document.documentElement.classList.add('fonts-loaded');
                });
              } else {
                setTimeout(function() {
                  document.documentElement.classList.add('fonts-loaded');
                }, 1000);
              }
            })()
          `,
          }}
        />
      </body>
    </html>
  );
}
