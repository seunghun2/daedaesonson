> ⚠️ **아카이브 문서** — 이 파일은 2026년 1월 시점의 스냅샷입니다. 최신 현황은 [`PROJECT_STATUS.md`](./PROJECT_STATUS.md)를 참조하세요.

# 🏛️ 대대손손 (Daedaesonson) 프로젝트 진행 기록

> **최종 업데이트**: 2026년 1월 7일  
> **프로젝트 목표**: 전국 장례시설 데이터베이스 구축 및 B2B 리드 생성 플랫폼

---

## 📌 프로젝트 개요

**대대손손**은 전국의 봉안당, 자연장지, 묘지, 화장장 정보를 수집·정규화하여 제공하는 데이터 플랫폼입니다.

### 비즈니스 모델
- **B2B 리드 생성**: 장례 상담 고객 → 장례지도사 연결
- **수익 분배**: 5:5 → 7:3 (레버리지 증가 시)
- **마음부고 연동**: 부고 플랫폼에 시설 검색 데이터 제공

---

## 📊 데이터 현황 (2026년 1월 기준)

### 크롤링 완료 소스
| 출처 | 건수 | 데이터 종류 |
|------|------|------------|
| E-SKY (보건복지부) | 1,500+ | 봉안시설, 묘지, 자연장지, 화장시설 |
| 한국장례정보원 (Archive) | 1,498 | 시설정보, 편의시설, 주차, 수용인원 |
| goifuneral.co.kr | - | 가격 데이터 |
| 개별 시설 웹사이트 | 330+ | 이미지, 상세 가격정보 |

### 정규화 진행률
| 항목 | 건수 | 상태 |
|------|------|------|
| 시설 기본정보 (1-720) | 720 | ✅ 100% 검증 완료 |
| 가격 데이터 | 1,488 | ✅ 동기화 완료 |
| 편의시설/어메니티 | 1,498 | ✅ 동기화 완료 |
| 주차 정보 | 587 | ✅ PDF 추출 |
| 수용인원 | 453 | ✅ PDF 추출 |
| 좌표 (Geocoding) | 1,498 | ✅ 완료 |

### 현재 진행 중
| 범위 | 상태 | 비고 |
|------|------|------|
| Item 1-720 | ✅ STABLE | 고신뢰도 검증 완료 |
| Item 721-1000 | 🟡 진행 중 | - |
| Item 1000+ 특수 감사 | ⏳ 대기 | 1000번대 특수 시설 |
| park-1050 삼광사추모공원 | ⏳ 대기 | Zero-price 감사 필요 |

---

## 🛠️ 주요 스크립트 카탈로그

### 📥 크롤링
```
scripts/crawlEsky.js          - E-SKY 포털 크롤링
scripts/archive_crawler.js    - 장례정보원 크롤링
scripts/crawl_goifuneral.js   - goifuneral 가격 크롤링
scripts/smart_price_crawler.js - 스마트 가격 추출
scripts/ncp_facility_crawler.js - NCP 시설 크롤링
scripts/deep_crawler.js       - 심층 크롤링 (30KB+)
```

### 📄 PDF 처리
```
scripts/extract_pdf_info.js      - PDF 정보 추출
scripts/extract_pdf_with_ocr.js  - OCR 텍스트 추출
scripts/extract_all_pdfs.js      - 전체 PDF 일괄 처리
scripts/analyze_pdfs_archive3.js - Archive3 PDF 분석
```

### 🔧 데이터 정규화
```
scripts/fix_hangul_nfc.js         - 한글 NFC 정규화
scripts/sort_facilities_json.js   - 시설 데이터 정렬
scripts/standardize_names.js      - 시설명 표준화
scripts/categorize_*.js           - 카테고리 분류
scripts/normalize_fee_names.js    - 요금명 정규화
```

### 📤 데이터베이스 동기화
```
scripts/sync_to_supabase_v2.js    - Supabase 동기화
scripts/upload_all_final.js       - 전체 업로드
scripts/fill_coordinates.js       - 좌표 데이터 채우기
scripts/migrate_*.js              - 마이그레이션 스크립트들
```

### ✅ 검증 & 품질관리
```
scripts/verify_all_facilities.js  - 전체 시설 검증
scripts/check_empty_*.js          - 빈 데이터 확인
scripts/validate_categories.js    - 카테고리 검증
scripts/find_duplicates.js        - 중복 찾기
```

### 💰 가격 처리
```
scripts/inject_*_gold.js          - 가격 데이터 주입 (Gold 버전)
scripts/process_nakwon_pricing.js - 낙원 가격 처리
scripts/update_prices_from_master.js - 마스터에서 가격 업데이트
scripts/fill_missing_pricing.js   - 누락 가격 채우기
```

---

## 📁 주요 데이터 파일

### 마스터 데이터
| 파일 | 용도 |
|------|------|
| `data/facilities.json` | 전체 시설 마스터 |
| `seeds.json` | 시드 데이터 |
| `dump.json` | 전체 덤프 (15MB+) |

### 가격 데이터
| 파일 | 용도 |
|------|------|
| `data/goifuneral_prices.csv` | goifuneral 가격 CSV |
| `park_price_master.xlsx` | 가격 마스터 엑셀 |
| `admin_prices_export.xlsx` | 관리자 가격 내보내기 |

### E-SKY 데이터
| 파일 | 용도 |
|------|------|
| `esky_봉안시설.json` | 봉안시설 |
| `esky_묘지.json` | 묘지 |
| `esky_자연장지.json` | 자연장지 |
| `esky_화장시설.json` | 화장시설 |

### 아카이브
| 폴더 | 용도 |
|------|------|
| `archive/` | 원본 아카이브 |
| `archive3/` | PDF 원본 |
| `archive4/` | 처리된 데이터 |
| `archive5/` | 최신 아카이브 |
| `archive5_images/` | 아카이브 이미지 |

---

## 🔒 인프라 구성

### 데이터베이스
- **Supabase** (PostgreSQL)
- **RLS 정책**: 7개 핵심 테이블 적용
  - `facilities` - 시설 정보
  - `inquiries` - 문의
  - `reviews` - 리뷰
  - 등등

### API
- **Next.js API Routes**
  - `GET /api/facilities` - 시설 목록
  - `GET /api/facilities/[id]` - 시설 상세
  - `POST /api/facilities/[id]/prices` - 가격 업데이트

### 저장소
- **Supabase Storage** - 시설 이미지
- `crawled_images_v2/` - 크롤링된 이미지 (330+ 개)

---

## 📝 기술적 마일스톤

### 2025년 12월
- [x] E-SKY 크롤링 완료 (1,500+ 시설)
- [x] Archive PDF 추출 (1,498 레코드)
- [x] RLS 보안 정책 배포
- [x] Item 1-720 정규화 완료

### 2026년 1월
- [x] 가격 데이터 동기화 (1,488건)
- [x] 편의시설 데이터 동기화 (1,498건)
- [x] Supabase 환경 분리 (Dev/Prod)
- [ ] Item 721-1000 정규화
- [ ] 1000번대 특수 시설 감사

---

## 🚀 다음 할 일

1. **가격 데이터 계속 처리**
   - `goifuneral_prices.csv` 나머지 처리
   - 누락된 시설 가격 채우기

2. **Item 721-1000 정규화**
   - 개별 시설 검증
   - 카테고리 정리

3. **1000번대 특수 감사**
   - park-1050 삼광사추모공원
   - Zero-price 시설 확인

4. **프론트엔드 연동**
   - 시설 검색 UI 개선
   - 가격 표시 UI

---

## 📞 참고 링크

- **E-SKY 포털**: https://esky.e-gov.go.kr
- **한국장례정보원**: https://archive.kfcs.or.kr
- **goifuneral**: https://goifuneral.co.kr
- **마음부고**: https://maeumbugo.co.kr

---

> 💡 **팁**: 새 작업을 시작할 때 이 문서를 업데이트하세요!
