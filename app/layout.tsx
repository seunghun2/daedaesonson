import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import '@mantine/core/styles.css';
import { ColorSchemeScript, MantineProvider, createTheme } from '@mantine/core';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '대대손손 - 전국 장사시설 비교 플랫폼',
  description: '장례식장, 봉안당 가격비교 및 예약 서비스',
  referrer: 'origin', // 네이버 지도 API 인증을 위해 필수
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
        {/* Google Material Symbols Outlined */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
        {/* 네이버 지도 API 스크립트 (클라이언트 ID는 환경변수에서 로드) */}
        {/* 실제 운영 시에는 strategy="beforeInteractive" 등을 고려 */}
      </head>
      <body className={inter.className}>
        <MantineProvider theme={theme}>
          {children}
        </MantineProvider>
      </body>
    </html>
  );
}
