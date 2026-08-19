> ⚠️ **아카이브 문서** — 이 파일은 2025년 12월 시점의 스냅샷입니다. 최신 현황은 [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)를 참조하세요.

# 🎯 대대손손 1차 데이터 통합 완료 상태

## ✅ 완료된 작업

### 1. **타입 시스템 완성** ✨
- [x] 확장된 Facility 타입
- [x] PriceInfo (상세 가격 테이블)
- [x] TransportInfo (교통/이동시간)
- [x] Highlight (핵심 지표)
- [x] Environment (환경 정보)
- [x] Tags, Status, ImageGallery

### 2. **상세 페이지 UI/UX** 🎨
- [x] 호갱노노 스타일 헤더
- [x] 핵심 지표 섹션
- [x] 아이콘화된 시설 정보 (Lucide Icons)
- [x] 카테고리별 가격 라벨
- [x] 환경 정보 표시
- [x] 교통 정보 (이동시간 + 대중교통)
- [x] 리뷰 섹션 준비
- [x] 플로팅 문의 버튼

### 3. **크롤링 시스템 구축** 🕷️
- [x] 사이트 스카우팅 스크립트
- [x] 첫장 크롤러
- [x] 명당가 크롤러
- [x] e하늘 크롤러 (기존)
- [x] 통합 크롤러 뼈대

---

## 📊 데이터 소스 현황

| 소스 | URL | 상태 | 크롤러 | 결과 파일 |
|------|-----|------|--------|-----------|
| **e하늘** | 15774129.go.kr | ✅ 완료 | crawlEsky.js | full_data.json |
| **첫장** | apply.cheotjang.com | 🔧 준비완료 | crawlCheotjang.js | cheotjang_facilities.json |
| **명당가** | myungdangga.co.kr | 🔧 준비완료 | crawlMyungdangga.js | myungdangga_facilities.json |

---

## 🚀 실행 가능한 명령어

```bash
# 스카우팅 (사이트 구조 분석)
npm run scout

# 개별 크롤링
npm run crawl:esky           # e하늘 (공공데이터)
npm run crawl:cheotjang      # 첫장
npm run crawl:myungdangga    # 명당가

# 통합 크롤링
npm run crawl:all
```

---

## 📂 프로젝트 구조

```
daedaesonson/
├── scripts/
│   ├── scoutSites.js           # 사이트 구조 분석
│   ├── crawlEsky.js            # e하늘 크롤러
│   ├── crawlCheotjang.js       # 첫장 크롤러
│   ├── crawlMyungdangga.js     # 명당가 크롤러
│   └── crawlAll.js             # 통합 크롤러
├── data/
│   ├── full_data.json          # e하늘 결과
│   ├── cheotjang_facilities.json
│   └── myungdangga_facilities.json
├── components/
│   └── detail/
│       └── FacilityDetail.tsx  # 상세 페이지
├── types/
│   └── index.ts                # 타입 정의
└── CRAWLING.md                 # 크롤링 가이드
```

---

## 🎯 다음 단계

### Phase 1: 데이터 수집 (진행중)
- [x] 스카우팅 완료
- [ ] **첫장 실제 크롤링 실행**
- [ ] **명당가 실제 크롤링 실행**
- [ ] 수집된 데이터 검증

### Phase 2: 데이터 정규화
- [ ] 3개 소스 데이터 통합 스크립트
- [ ] 주소 기반 중복 제거
- [ ] 가격 정보 정규화
- [ ] 이미지 URL 검증

### Phase 3: DB 저장
- [ ] Prisma 스키마 업데이트
- [ ] Migration 실행
- [ ] 데이터 임포트 스크립트
- [ ] 데이터 확인

### Phase 4: UI 테스트
- [ ] 실제 데이터로 상세 페이지 테스트
- [ ] 가격 테이블 표시 확인
- [ ] 교통 정보 표시 확인
- [ ] 이미지 갤러리 구현

---

## 💡 현재 가능한 작업

1. **첫장 크롤링 실행**
   ```bash
   npm run crawl:cheotjang
   ```
   - 봉안당/수목장/공원묘지 리스트 수집
   - 결과: `data/cheotjang_facilities.json`

2. **명당가 크롤링 실행**
   ```bash
   npm run crawl:myungdangga
   ```
   - 개별 시설 상세정보 수집
   - 결과: `data/myungdangga_facilities.json`

3. **결과 확인**
   ```bash
   cat data/cheotjang_facilities.json | jq .
   cat data/myungdangga_facilities.json | jq .
   ```

---

## 📸 스카우팅 결과

생성된 파일:
- `cheotjang_screenshot.png` - 첫장 화면
- `cheotjang_structure.json` - HTML 구조
- `myungdangga_screenshot.png` - 명당가 화면
- `myungdangga_structure.json` - HTML 구조

---

## ⚡ Quick Start

```bash
# 1. 첫장 크롤링
npm run crawl:cheotjang

# 2. 명당가 크롤링
npm run crawl:myungdangga

# 3. 결과 확인
ls -lh data/*.json

# 4. 개발 서버 실행
npm run dev
```

---

**✨ 1차 통합 준비 완료!**
이제 실제 크롤링을 실행하고 데이터를 수집할 단계입니다.
