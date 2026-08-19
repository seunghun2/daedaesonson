# 🏛️ 대대손손 프로젝트 현황 (2026-04-20 기준)

> 이 문서는 기존 `STATUS.md`, `DAEDAESONSON_PROGRESS.md`, `PROJECT_ANALYSIS.md` 3개 문서를 통합·최신화한 것입니다.

---

## 📌 프로젝트 개요

**대대손손**은 전국의 봉안당, 자연장지, 묘지, 화장장 정보를 수집·정규화하여 제공하는 데이터 플랫폼입니다.

- **URL**: https://daedaesonson.com
- **Framework**: Next.js 16 (App Router, React 19)
- **Database**: Supabase (PostgreSQL) + RLS 정책
- **Hosting**: Vercel (자동 배포)
- **UI**: Mantine v8 + Tailwind CSS

---

## ✅ 완료된 기능 (2026-04-20 기준)

### 핵심 플랫폼
- [x] **네이버 지도 연동** — 마커/클러스터링, 가격 표시, 주변 시설 추천
- [x] **시설 상세 페이지** — 5,000줄+ FacilityDetail, 가격 탭/테이블, 편의시설, 위치
- [x] **시설 리스트/검색/필터** — Drawer 방식 통일, 문의시설 제외, 공설/사설 필터
- [x] **지역별 SEO 랜딩** — `/region/[slug]` 동적 페이지

### 데이터
- [x] **시설**: 2,579개 (E-SKY 1,500+ / Archive 1,498)
- [x] **가격 데이터**: 1,488건 동기화 완료
- [x] **편의시설/어메니티**: 1,498건 동기화 완료
- [x] **좌표 (Geocoding)**: 1,498건 완료
- [x] **이미지 정수작업**: 232개 시설, 1,333장 Supabase 업로드 완료

### AI 챗봇 (Phase 3 완료)
- [x] 가격 검색 (`standardizedPrices` 전체 탐색)
- [x] 지역 필터 (사용자 메시지 우선, AI 응답 오염 방지)
- [x] 시설 비교 카드 (조건부 표시, 공립/민간 혼합)
- [x] 가격표 인라인 렌더링
- [x] 주변 시설 추천 (Haversine 좌표 기반 50km)
- [x] 10턴 제한 + 로그인 연동
- [x] 21건 디버깅 완료 (캐싱, 레이스컨디션, 프롬프트 인젝션 등)

### 블로그
- [x] **11편 발행** (SSR, 어드민 CRUD)
- [x] SEO — JSON-LD (BlogPosting, BreadcrumbList), OG태그, sitemap 동적 추가
- [x] 강남언니 스타일 디자인, 카테고리 6개

### 인증 & CRM
- [x] **카카오 로그인** — setSession 방식, 세션 유지 문제 해결
- [x] **OTP 휴대전화 인증** — Supabase JS admin client, SOLAPI 연동
- [x] **Slack 8채널 알림** — 챗봇/맞춤추천/전화상담/1:1문의/정보수정/후기/제휴/에러
- [x] **맞춤추천 폼** — Supabase 저장 + Slack 알림 + 어드민 관리

### 어드민
- [x] 시설 편집 (가격 V1/V2, 이미지, 기본정보)
- [x] 블로그 관리 (CRUD, 발행/임시)
- [x] 맞춤추천 관리 (상태 변경, 검색)
- [x] 대시보드 실제 DB 연동 (7개 API 병렬)

### SEO & 마케팅
- [x] sitemap.xml (동적 블로그 포함)
- [x] robots.txt (admin/api 차단)
- [x] JSON-LD 구조화 데이터 (Organization, WebPage, BlogPosting)
- [x] OG Image, Twitter Card, canonical URL
- [x] 네이버/구글 서치어드바이저 등록
- [x] GA4 + Google Ads 전환 추적

### 성능 & UX
- [x] 가격 Flash 방지 (API 도착까지 가격 섹션 미표시)
- [x] ScrollableTabsList 공통 컴포넌트 (드래그/스와이프/화살표)
- [x] 후기 등록 API 속도 최적화 (2-3초 → 0.5-1초)
- [x] About 페이지 모바일 360px 최적화
- [x] Material Symbols FOUT 방지

---

## 🟡 진행 중 / 미완료

### 네이버 리뷰 수집 (Phase 1-2 완료, Phase 3 중단)
- [x] Phase 1: 시설-PlaceID 매칭 (1,495건) ✅
- [x] Phase 2: 리뷰 존재 여부 필터링 ✅
- [ ] **Phase 3**: 리뷰 텍스트 수집 — ⚠️ IP 차단으로 중단 (대기시간 확대 후 재시도 필요)
- [ ] Phase 4: 검수
- [ ] Phase 5: DB 삽입 + UI 출처 표시

### 잔여 TODO
- [ ] **가격 재확인**: park-0067 (금호동성당 천보묘원), park-0073 (춘천공원묘원)
- [ ] **중복 이미지 정리**: park-0508, park-0617, park-1235 (어드민에서 수동 삭제)
- [ ] **env-check 디버그 API 삭제** (`app/api/debug/env-check/route.ts`) — 보안 이슈
- [ ] **가격 데이터 계속 처리**: Item 709부터 재개 (goifuneral_prices.csv)

---

## 🔴 향후 로드맵

### 단기 (1개월)
- [ ] 네이버 리뷰 수집 완료 (IP 변경 후 재시도)
- [ ] 후기 0개 시설 CTA 강화 ("첫 번째 후기를 남겨주세요!")
- [ ] FacilityDetail.tsx 컴포넌트 분리 리팩토링 (5,000줄+ → 8개 서브컴포넌트)
- [ ] 블로그 추가 발행 (주 2-3편)

### 중기 (1-3개월)
- [ ] 시설 비교 기능 (2-3개 나란히 비교)
- [ ] 비용 시뮬레이터 ("봉안 10년 기준 총 비용")
- [ ] 상세페이지 큐레이션 강화 (전문가 코멘트)
- [ ] 챗봇 Phase 4 CRM (어드민 상담 탭, 태그 분류, 고객 프로필)

### 장기 (3개월+)
- [ ] 사용자 후기/리뷰 시스템 고도화
- [ ] 카카오/네이버 알림 연동 (가격 변동, 빈자리)
- [ ] 장례 견적 시스템 (올인원 비용 계산)

---

## 📊 경쟁사 대비 현황

| 항목 | 대대손손 | 장서 | e하늘 |
|------|---------|------|-------|
| 시설 수 | ✅ 2,579개 | 26개 | 많음 |
| UI/UX | ✅ 우수 | 양호 | 낙후 |
| 가격 투명성 | ✅ 마커+상세 | 상세만 | 없음 |
| AI 챗봇 | ✅ Gemini | 없음 | 없음 |
| 블로그/SEO | ✅ 11편+JSON-LD | 40편+ (네이버) | 없음 |
| 큐레이션 | ⚠️ 보완 중 | ✅ 강점 | 없음 |
| 신뢰 콘텐츠 | ⚠️ 리뷰 수집 중 | ✅ 전문가 | 공공기관 |

---

## 🛠️ 주요 스크립트

### 크롤링
```
scripts/crawlEsky.js          - E-SKY 포털 크롤링
scripts/archive_crawler.js    - 장례정보원 크롤링
scripts/naver-place-match.js  - 네이버 PlaceID 매칭
scripts/naver-review-crawl.js - 네이버 리뷰 수집
```

### 데이터 처리
```
scripts/sync_to_supabase_v2.js    - Supabase 동기화
scripts/bulk-upload-images.js      - 이미지 일괄 업로드
scripts/sync_rep_price_to_db.js    - 대표가격 동기화
scripts/fix_hangul_nfc.js          - 한글 NFC 정규화
```

### 검증
```
scripts/verify_all_facilities.js   - 전체 시설 검증
scripts/check_empty_*.js           - 빈 데이터 확인
scripts/find_duplicates.js         - 중복 찾기
```

---

## 📁 주요 데이터 파일

| 파일 | 용도 |
|------|------|
| `data/facilities.json` | 전체 시설 마스터 (2,579개) |
| `seeds.json` | 시드 데이터 |
| `scraped-reviews/` | 네이버 리뷰 수집 결과 |
| `scraped-images/` | 크롤링 이미지 (정수 완료) |
| `park_price_master.xlsx` | 가격 마스터 엑셀 |

---

## 📝 문서 가이드

| 문서 | 용도 |
|------|------|
| `README.md` | 프로젝트 소개·실행 가이드 |
| `PROJECT_STATUS.md` | **이 파일** — 프로젝트 현황 통합 |
| `상세페이지.md` | FacilityDetail 아키텍처 문서 |
| `CEMETERY_TERMS_QNA.md` | 공원묘원 용어 Q&A (CS 참고) |
| `PRICING_UPDATE_STATUS.md` | 가격 업데이트 작업 가이드 |
| `0408_네이버_리뷰수집_플랜.md` | 리뷰 수집 5단계 플랜 |
| `0XXX_작업내역.md` | 날짜별 작업 로그 (10편) |

---

> 💡 **참고**: 이전의 `STATUS.md`, `DAEDAESONSON_PROGRESS.md`, `PROJECT_ANALYSIS.md`는 2025.12~2026.01 시점의 스냅샷으로, 이 문서로 대체되었습니다.
