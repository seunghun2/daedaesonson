# 🏷️ 시설 가격 데이터 구조 (V1 → V2)

> 최종 업데이트: 2026-02-12  
> 작성: 대대손손 개발팀

---

## 📋 목차

1. [개요](#개요)
2. [V1: 레거시 priceTable](#v1-레거시-pricetable)
3. [V2: 표준화 standardizedPrices](#v2-표준화-standardizedprices)
4. [매핑 규칙](#매핑-규칙)
5. [데이터 흐름](#데이터-흐름)
6. [API 응답 구조](#api-응답-구조)
7. [프론트엔드 렌더링](#프론트엔드-렌더링)
8. [마이그레이션](#마이그레이션)
9. [롤백 (V2 → V1 복원)](#롤백-v2--v1-복원)
10. [참고 자료 (PDF/이미지)](#참고-자료-pdfimg)

---

## 개요

시설(장지) 가격 데이터는 Supabase `Facility` 테이블의 `pricing` JSON 컬럼에 저장됩니다.

| 항목 | V1 (레거시) | V2 (표준화) |
|------|-------------|-------------|
| **데이터 키** | `priceTable` | `standardizedPrices` |
| **구조** | 한국어 카테고리 키 (매장묘, 봉안당, ...) | `serviceType` 기반 배열 (BURIAL, BONGSAN, NATURAL) |
| **문제점** | 시설 category에 따라 일부 카테고리만 표시됨 | 모든 서비스가 표시됨 |
| **상태** | 유지 (삭제 안 됨) | 2026-02-12 마이그레이션 완료 (1,263개 시설) |

### 핵심 원칙
- **V1은 절대 삭제하지 않는다** — 항상 원본 보존
- **V2가 있으면 V2로 렌더링**, 없으면 V1 폴백
- **문제 발생 시 V2만 제거하면 즉시 V1으로 복원**

---

## V1: 레거시 priceTable

### 구조

```json
{
  "priceTable": {
    "매장묘": {
      "unit": "원",
      "rows": [
        {
          "name": "사용료",
          "grade": "1평",
          "price": 3000000,
          "isRepresentative": true
        },
        {
          "name": "관리비",
          "grade": "연관리비",
          "price": 25000,
          "isRepresentative": false
        }
      ]
    },
    "봉안당": {
      "unit": "원",
      "rows": [
        {
          "name": "1위형",
          "grade": "기본",
          "price": 400000,
          "isRepresentative": true
        }
      ]
    },
    "단장형": { "rows": [], "unit": "" },
    "합장형": { "rows": [], "unit": "" },
    "수목형": { "rows": [], "unit": "" }
  }
}
```

### 카테고리 목록 (한국어 키)

전체 16개 카테고리가 존재할 수 있음:

| 카테고리 | 설명 |
|----------|------|
| 매장묘 | 일반 매장 |
| 단장형 | 단장(홑장) |
| 합장형 | 합장(함께 안치) |
| 쌍분형 | 쌍분(나란히) |
| 복합묘 | 복합묘 |
| 평장묘 | 평장(평지형) |
| 봉안당 | 납골당/봉안시설 |
| 봉안담 | 봉안벽/담장형 |
| 봉안묘 | 납골묘 |
| 수목형 | 수목장 |
| 잔디형 | 잔디장 |
| 화초형 | 화초장 |
| 암석형 | 암석장 |
| 가족형 | 가족형 자연장 |
| 기타 | 기타 (변환 제외) |
| 제외됨 | 제외 대상 (변환 제외) |

### V1의 문제점
- 빈 rows (`[]`)를 가진 카테고리가 항상 존재 → 실제 데이터 없는 카테고리가 노출
- 시설의 `category` (FAMILY_GRAVE, NATURAL_BURIAL 등)에 따라 프론트에서 필터링 → **봉안당이 FAMILY_GRAVE 시설에서 안 보이는 문제**
- 카테고리명이 한국어라 프로그래밍 처리가 불편

---

## V2: 표준화 standardizedPrices

### 구조

```json
{
  "standardizedPrices": [
    {
      "serviceType": "BURIAL",
      "subType": "매장묘",
      "unit": "원",
      "rows": [
        {
          "name": "사용료",
          "price": 3000000,
          "feeType": "USAGE",
          "grade": "1평",
          "note": "",
          "isRepresentative": true
        }
      ]
    },
    {
      "serviceType": "BONGSAN",
      "subType": "봉안당",
      "unit": "원",
      "rows": [
        {
          "name": "1위형",
          "price": 400000,
          "feeType": "USAGE",
          "grade": "기본",
          "isRepresentative": true
        }
      ]
    },
    {
      "serviceType": "NATURAL",
      "subType": "가족형",
      "unit": "원",
      "rows": [...]
    }
  ]
}
```

### ServiceType 대분류 (3종)

| serviceType | 라벨 | 아이콘 (Lucide) | 포함 subType |
|-------------|------|----------------|-------------|
| `BURIAL` | 매장묘 | `<Mountain />` | 매장묘, 단장형, 합장형, 쌍분형, 복합묘, 평장묘 |
| `BONGSAN` | 봉안(납골) | `<Archive />` | 봉안당, 봉안담, 봉안묘 |
| `NATURAL` | 수목장(자연장) | `<Trees />` | 수목형, 잔디형, 화초형, 암석형, 가족형, 수목장 |

### Row 필드 상세

```typescript
interface PriceRow {
  name: string;           // 항목명 (예: "사용료", "1위형")
  price: number;          // 가격 (원)
  feeType: string;        // 'USAGE' | 'MANAGEMENT' | 'INSTALLATION' | 'OTHER'
  grade: string;          // 등급/규격 (예: "1평", "VIP", "기본")
  note: string;           // 비고
  isRepresentative: boolean; // 대표 가격 여부
  
  // 선택 필드
  area?: number;          // 면적
  areaUnit?: string;      // 면적 단위 (㎡, 평)
  duration?: number;      // 사용 기간
  durationType?: string;  // 기간 단위 (YEAR, MONTH)
  capacity?: string;      // 안치 인원
  residency?: string;     // 거주지 구분 ('LOCAL' | 'NON_LOCAL' | 'VETERAN' | 'ALL')
  groupType?: string;     // 탭 분류 키
  paymentCycle?: string;  // 납부 주기 ('MONTHLY' | 'YEARLY' | 'ONETIME')
  taxIncluded?: boolean;  // 부가세 포함 여부
}
```

### V2의 장점
- ✅ **빈 카테고리 자동 제외** — rows가 있는 것만 포함
- ✅ **시설 category 무관하게 모든 서비스 표시** — 봉안당 + 매장 + 자연장 동시 표시
- ✅ **3단 계층 UI** — serviceType(대분류) → subType(세부) → 개별 항목
- ✅ **feeType별 분리** — 사용료/관리비/부가옵션 구분 표시
- ✅ **뱃지 표시** — 관내/관외, 월납/연납 등

---

## 매핑 규칙

### 한국어 카테고리 → serviceType

```typescript
const SERVICE_TYPE_MAP: Record<string, string> = {
    // BURIAL (매장)
    '매장묘': 'BURIAL',
    '단장형': 'BURIAL',
    '합장형': 'BURIAL',
    '쌍분형': 'BURIAL',
    '복합묘': 'BURIAL',
    '평장묘': 'BURIAL',
    
    // BONGSAN (봉안/납골)
    '봉안당': 'BONGSAN',
    '봉안담': 'BONGSAN',
    '봉안묘': 'BONGSAN',
    
    // NATURAL (자연장/수목장)
    '수목형': 'NATURAL',
    '잔디형': 'NATURAL',
    '화초형': 'NATURAL',
    '암석형': 'NATURAL',
    '가족형': 'NATURAL',
    '수목장': 'NATURAL',
};

// 제외 대상 (변환하지 않음):
// - '기타'
// - '제외됨'
// - 매핑에 없는 키 → 'OTHER'로 분류
```

### 매핑 적용 위치 (3곳 동일)

| 파일 | 용도 |
|------|------|
| `scripts/migrate-standardized-prices.ts` | 일괄 마이그레이션 스크립트 |
| `app/api/facilities/[id]/route.ts` | 시설 상세 API (런타임 폴백) |
| `app/api/facilities/[id]/prices/route.ts` | 가격 전용 API (런타임 폴백) |

> ⚠️ **매핑 변경 시 3곳 모두 수정해야 함!**

---

## 데이터 흐름

### 시설 상세 페이지 로딩

```
[사용자가 /facility/park-0001 접속]
        ↓
[app/facility/[id]/page.tsx]
        ↓ fetch(`/api/facilities/${id}`)
        ↓
[app/api/facilities/[id]/route.ts]
        ↓ Supabase에서 pricing JSON 로드
        ↓ standardizedPrices가 있으면 → 그대로 반환
        ↓ 없으면 → priceTable에서 런타임 변환 (폴백)
        ↓
[components/detail/FacilityDetail.tsx]
        ↓ facility.priceInfo 전달
        ↓
[PriceInfoSection 컴포넌트]
        ↓ standardizedPrices 있으면 → V2 렌더링 (아코디언)
        ↓ 없으면 → V1 레거시 렌더링 (테이블)
```

### 어드민 업로드/수정

```
[어드민이 /admin/upload에서 시설 편집]
        ↓
[StandardPriceEditor 컴포넌트]
        ↓ 직접 standardizedPrices 편집/저장
        ↓ 
[/api/admin/facilities 업데이트]
        ↓ pricing JSON에 standardizedPrices 포함하여 저장
        → 새 시설은 처음부터 V2 구조로 저장됨
```

---

## API 응답 구조

### GET /api/facilities/[id] (시설 상세)

```json
{
  "id": "park-0001",
  "name": "(재)낙원추모공원",
  "category": "FAMILY_GRAVE",
  "priceInfo": {
    "priceTable": { ... },           // V1 (항상 존재)
    "standardizedPrices": [ ... ]    // V2 (마이그레이션 후 존재)
  },
  "images": [ ... ],
  "reviews": [ ... ]
}
```

### GET /api/facilities/[id]/prices (가격 전용)

```json
{
  "facility": {
    "id": "park-0001",
    "name": "(재)낙원추모공원",
    "category": "FAMILY_GRAVE",
    "priceRange": { "min": 300, "max": 6465 }
  },
  "priceTable": { ... },              // V1
  "standardizedPrices": [ ... ],       // V2
  "_meta": {
    "source": "supabase",
    "categoryCount": 16,
    "itemCount": 60,
    "standardizedCount": 4
  }
}
```

---

## 프론트엔드 렌더링

### PriceInfoSection (FacilityDetail.tsx)

```
V2 렌더링 조건:
  standardizedPrices가 존재 AND
  standardizedPrices.length > 0 AND
  최소 1개의 group에 rows가 있음

V2 UI 구조:
  ┌─────────────────────────────────────┐
  │ 사용료                               │
  │                                     │
  │ ⛰ 매장묘              300만원부터 > │ ← 대분류 아코디언
  │ ┌─────────────────────────────────┐ │
  │ │ 매장묘 (4 항목)                  │ │ ← 세부 아코디언 (subType)
  │ │   사용료    1평        300만원   │ │ ← 개별 항목
  │ │   관리비    연관리비    2.5만원   │ │
  │ │   ...                          │ │
  │ │ 평장묘 (14 항목)                 │ │
  │ │   ...                          │ │
  │ └─────────────────────────────────┘ │
  │                                     │
  │ 📦 봉안(납골)            4만원부터 > │ ← 대분류 아코디언
  │                                     │
  │ 🌳 수목장(자연장)     1,190만원부터 > │ ← 대분류 아코디언
  └─────────────────────────────────────┘

V1 폴백 UI:
  - 기존 테이블 형식 (탭 전환)
```

### 가격 포맷팅

```typescript
// formatKoreanCurrency 함수
3000000 → "300만원"
400000  → "40만원"
25000   → "2.5만원"
1500    → "1,500원"
```

### feeType별 섹션 분리

| feeType | 표시 위치 | 스타일 |
|---------|----------|--------|
| `USAGE` | 메인 목록 | 기본 행 |
| `MANAGEMENT` | "📋 관리비 안내" 박스 | 파란색 배경 |
| `INSTALLATION`, `OTHER` | "💡 부가 옵션" 박스 | 회색 테두리 |

---

## 마이그레이션

### 실행 이력

| 일시 | 유형 | 결과 |
|------|------|------|
| 2026-02-12 19:34 | 1차 마이그레이션 (1~1000) | ✅ 916개 변환, 0 에러, 84개 스킵(빈 데이터) |
| 2026-02-12 20:03 | 2차 마이그레이션 (전체) | ✅ 347개 추가 변환, 0 에러 (페이지네이션 수정 후) |
| 2026-02-12 20:05 | **전체 검증** | ✅ **1,263/1,263 일치, 불일치 0건** (232개 가격 없음) |

> 📌 1차 마이그레이션 시 Supabase 기본 1000개 제한으로 park-1001 이후 347개 누락 발생.
> 스크립트에 페이지네이션 추가 후 2차 실행으로 해결.

### 스크립트 위치

```
scripts/migrate-standardized-prices.ts
```

### 실행 방법

```bash
# Dry-run (미리보기만, 실제 저장 안 함)
npx tsx scripts/migrate-standardized-prices.ts --dry-run

# 실제 실행
npx tsx scripts/migrate-standardized-prices.ts
```

### 처리 방식
1. Supabase에서 모든 시설의 `pricing` JSON 로드
2. 이미 `standardizedPrices`가 있으면 스킵
3. `priceTable`에서 rows가 있는 카테고리만 변환
4. `기타`, `제외됨` 카테고리는 변환 제외
5. 기존 `pricing` JSON에 `standardizedPrices` 필드만 추가 (V1 유지)
6. 한 건씩 순차 업데이트

---

## 롤백 (V2 → V1 복원)

### V2에 문제가 있을 때

**방법 1: 프론트엔드에서 V2 비활성화 (즉시)**

`components/detail/FacilityDetail.tsx`의 `PriceInfoSection`:

```typescript
// 이 줄을 변경:
const hasStandardized = standardizedPrices && standardizedPrices.length > 0 && ...

// → 강제로 false:
const hasStandardized = false; // V1 강제 사용
```

**방법 2: DB에서 standardizedPrices 필드 제거 (완전 롤백)**

```sql
-- Supabase SQL Editor에서 실행
UPDATE "Facility"
SET pricing = pricing - 'standardizedPrices'
WHERE pricing ? 'standardizedPrices';
```

**방법 3: 특정 시설만 V1으로 복원**

```sql
UPDATE "Facility"
SET pricing = pricing - 'standardizedPrices'
WHERE id = 'park-0001';
```

### 주의사항
- V1 `priceTable`은 마이그레이션에서 **절대 수정/삭제되지 않음**
- 롤백은 `standardizedPrices` 필드만 제거하면 완료
- 어드민 StandardPriceEditor에서 수동 편집한 V2 데이터는 롤백 시 유실됨

---

## 참고 자료 (PDF/IMG)

### 위치

```
/Users/el/Desktop/daedaesonson/대대손손 파일리스트/
```

### 구조

```
대대손손 파일리스트/
├── 01. (재)낙원추모공원.pdf          ← 시설 가격표/안내서 PDF
├── 01. (재)낙원추모공원/             ← 시설 사진
│   ├── 1626668147045. 메인 사진 1.jpg
│   ├── 1626668215212.jpg
│   └── ...
├── 02. (재)실로암공원묘원.pdf
├── 02. 실로암공원묘원/
│   └── ...
└── ... (총 30개 시설)
```

### 활용
- 가격 데이터 검증 시 PDF 원본과 대조
- 시설 이미지 업로드 시 참고
- 총 30개 시설에 대한 상세 자료 보유

### 조례 데이터

```
/Users/el/Desktop/daedaesonson/data/ordinance_hwp/
├── 강릉시/
├── 거제시/
├── 광주광역시/
└── ... (130+ 지역)
```

지자체별 장사시설 관련 조례 원문 (HWP 형식)

---

## 관련 파일 인덱스

| 파일 | 역할 |
|------|------|
| `types/index.ts` | `ServicePriceGroup`, `PriceInfo`, `PriceTable` 타입 정의 |
| `components/detail/FacilityDetail.tsx` | `PriceInfoSection` — V2/V1 렌더 분기 |
| `app/facility/[id]/page.tsx` | 시설 상세 페이지 (API에서 데이터 로드) |
| `app/api/facilities/[id]/route.ts` | 시설 상세 API (런타임 V2 변환 폴백 포함) |
| `app/api/facilities/[id]/prices/route.ts` | 가격 전용 API (런타임 V2 변환 폴백 포함) |
| `app/admin/upload/StandardPriceEditor.tsx` | 어드민 V2 가격 편집기 |
| `scripts/migrate-standardized-prices.ts` | 일괄 마이그레이션 스크립트 (페이지네이션 지원) |
| `scripts/verify-prices.ts` | V1/V2 비교 검증 (범위 지정 가능) |
| `scripts/verify-prices-all.ts` | 전체 시설 V1/V2 정합성 검증 |
