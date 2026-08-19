# 🏛️ 대대손손 (Daedaesonson)

> **전국 장지 가격 비교 전문 플랫폼** — 봉안당·수목장·공원묘지·화장장 정보를 투명하게

[![Deploy](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel)](https://daedaesonson.com)

---

## 📌 프로젝트 개요

대대손손은 전국 **2,579개** 장례시설의 가격·위치·편의시설 정보를 수집·정규화하여 제공하는 데이터 플랫폼입니다.

### 비즈니스 모델
- **B2B 리드 생성**: 장례 상담 고객 → 장례지도사 연결
- **수익 분배**: 5:5 → 7:3 (레버리지 증가 시)
- **마음부고 연동**: 부고 플랫폼에 시설 검색 데이터 제공

---

## ⚡ Quick Start

```bash
# 1. 저장소 클론
git clone https://github.com/seunghun2/daedaesonson.git
cd daedaesonson

# 2. 의존성 설치
npm install

# 3. 환경변수 설정 (.env.local)
cp .env .env.local
# → Supabase, Kakao, Slack, Gemini 등 키 설정

# 4. 개발 서버 실행
npm run dev
```

http://localhost:3000 에서 확인

---

## 🛠️ 기술 스택

| 영역 | 기술 |
|------|------|
| **Framework** | Next.js 16 (App Router, React 19) |
| **UI** | Mantine v8 + Tailwind CSS |
| **Database** | Supabase (PostgreSQL) + RLS 정책 |
| **AI 챗봇** | Google Gemini API |
| **지도** | 네이버 지도 API (마커, 클러스터링) |
| **인증** | 카카오 로그인 + OTP 휴대전화 인증 |
| **알림** | Slack Webhook (8채널 실시간) |
| **배포** | Vercel (자동 배포) |
| **크롤링** | Playwright + Puppeteer |
| **이미지** | Sharp (리사이즈) + Supabase Storage |

---

## 📂 프로젝트 구조

```
daedaesonson/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 메인 (지도 + 시설 리스트)
│   ├── facility/[id]/            # 시설 상세 페이지
│   ├── list/                     # 시설 리스트 페이지
│   ├── about/                    # 회사 소개 (About)
│   ├── guide/                    # 블로그 (SSR)
│   ├── region/[slug]/            # 지역별 SEO 랜딩
│   ├── admin/                    # 어드민 대시보드
│   │   ├── upload/               # 시설 편집
│   │   ├── blog/                 # 블로그 관리
│   │   └── recommendations/      # 맞춤추천 관리
│   └── api/                      # API Routes
│       ├── facilities/           # 시설 CRUD
│       ├── chat/                 # AI 챗봇
│       ├── blog/                 # 블로그 API
│       ├── recommendation/       # 맞춤추천
│       ├── consult/              # 전화상담
│       └── auth/                 # 인증 (OTP)
├── components/
│   ├── map/                      # 네이버 지도 컴포넌트
│   ├── detail/                   # 시설 상세 (FacilityDetail 5,000줄+)
│   ├── list/                     # 시설 리스트/카드
│   ├── chatbot/                  # AI 챗봇 UI
│   └── auth/                     # 인증 (AuthProvider)
├── lib/                          # 유틸리티 (Supabase, Slack 등)
├── data/                         # 시설 마스터 JSON
├── scripts/                      # 크롤링·마이그레이션 스크립트
├── public/                       # 정적 파일 (OG이미지, 블로그 이미지)
└── docs/                         # 문서
```

---

## 📊 데이터 현황

| 항목 | 수량 |
|------|------|
| 전체 시설 | 2,579개 |
| 가격 데이터 보유 시설 | 1,488개 |
| 시설 이미지 | 1,333장 (Supabase Storage) |
| 블로그 발행 | 11편 |
| Slack 알림 채널 | 8개 |

### 데이터 소스
| 출처 | 건수 |
|------|------|
| E-SKY (보건복지부) | 1,500+ |
| 한국장례정보원 (Archive) | 1,498 |
| goifuneral.co.kr | 가격 데이터 |
| 개별 시설 웹사이트 | 330+ (이미지, 상세 가격) |

---

## 🔧 주요 스크립트

```bash
# 크롤링
npm run crawl:esky           # e하늘 (공공데이터)
npm run crawl:cheotjang      # 첫장
npm run crawl:myungdangga    # 명당가
npm run crawl:all            # 통합 크롤링

# 데이터 처리
node scripts/sync_to_supabase_v2.js    # Supabase 동기화
node scripts/bulk-upload-images.js      # 이미지 일괄 업로드

# 블로그
# 어드민 페이지에서 직접 관리 (https://daedaesonson.com/admin/blog)
```

---

## 🌐 배포

Vercel에 자동 배포됩니다. `main` 브랜치 push 시 자동 빌드·배포.

```bash
git add .
git commit -m "feat: 변경사항 설명"
git push origin main
```

---

## 📝 환경변수 (Vercel)

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 키 |
| `SUPABASE_SERVICE_KEY` | Supabase 서비스 키 (서버 전용) |
| `GEMINI_API_KEY` | Google Gemini AI 챗봇 |
| `KAKAO_CLIENT_SECRET` | 카카오 로그인 |
| `SOLAPI_API_KEY/SECRET/SENDER` | OTP 문자 발송 |
| `SLACK_02_*` | Slack 8채널 Webhook URL |
| `NEXT_PUBLIC_NAVER_MAP_CLIENT_ID` | 네이버 지도 |

---

## 📞 관련 서비스

- **대대손손**: https://daedaesonson.com
- **마음부고**: https://maeumbugo.co.kr
- **E-SKY 포털**: https://esky.e-gov.go.kr

---

© 2026 대대손손. All rights reserved.
