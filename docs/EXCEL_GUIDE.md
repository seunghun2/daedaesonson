# 📊 시설 정보 엑셀 변환 가이드

## 개요

archive 폴더의 각 시설 PDF에서 정보를 추출하여 **엑셀 파일(.xlsx)**로 저장합니다.

## 🚀 빠른 시작

### 홈페이지 검색 없이 빠르게 실행

```bash
node scripts/create_excel_from_pdf.js --skip-website
```

### 홈페이지 크롤링 포함 전체 실행

```bash
node scripts/create_excel_from_pdf.js
```

## 📋 엑셀 파일 구조

생성되는 엑셀 파일에는 다음 컬럼들이 포함됩니다:

| 컬럼 | 설명 | 예시 |
|------|------|------|
| **No.** | 시설 번호 | 1 |
| **구분** | 시설 유형 | 사설, 공설, 법인, 종교 |
| **시설명** | 시설 이름 | (재)낙원추모공원 |
| **홈페이지** | 공식 웹사이트 | http://example.com |
| **주소** | 전체 주소 | 경상남도 김해시 한림면... |
| **전화번호** | 대표 전화 | 055-343-0656 |
| **팩스번호** | 팩스 번호 | 055-343-0650 |
| **총매장능력** | 매장 수용 능력 | 30000 |
| **편의시설** | 편의시설 아이콘 | 🍴 🅿️ |
| **업데이트** | 마지막 업데이트 | 3개월전 |

## 📁 파일 위치

```
daedaesonson/
├── archive/                              # 원본 PDF 폴더
│   ├── 1.(재)낙원추모공원/
│   │   └── 1.(재)낙원추모공원_price_info.pdf
│   └── ...
├── scripts/
│   └── create_excel_from_pdf.js         # 실행 스크립트
└── facility_data/
    └── facilities_info_2025-12-12.xlsx  # 생성된 엑셀 파일
```

## 🔍 홈페이지 크롤링 기능

`--skip-website` 옵션을 제거하면 자동으로 각 시설의 홈페이지를 검색합니다:

- 네이버 검색 활용
- 블로그/카페 자동 제외
- 공식 사이트만 추출
- 안전한 3초 딜레이

**주의**: 홈페이지 검색은 시간이 오래 걸립니다 (시설당 약 5초)

## ⏱️ 예상 소요 시간

- **홈페이지 검색 제외**: 약 10-30초 (전체 시설 기준)
- **홈페이지 검색 포함**: 약 2-3시간 (1500개 시설 × 5초)

## 💡 팁

### 엑셀 파일 바로 열기
```bash
open facility_data/facilities_info_*.xlsx
```

### 도움말 보기
```bash
node scripts/create_excel_from_pdf.js --help
```

### 개별 스크립트 실행

PDF 추출만:
```bash
node scripts/extract_pdf_info.js
```

엑셀 생성만 (이미 추출된 JSON 사용):
```bash
node scripts/create_facility_excel.js
```

## 📊 출력 예시

실행 후 다음과 같은 통계가 표시됩니다:

```
📊 통계:
  • 총 시설: 10개
  • 전화번호: 10개
  • 주소: 10개
  • 매장능력: 4개
  • 홈페이지: 0개

📈 유형별:
  • 사설: 10개

📁 저장 위치:
  /Users/el/Desktop/daedaesonson/facility_data/facilities_info_2025-12-12.xlsx
```

## ⚙️ 커스터마이징

### PDF 추출 패턴 수정
`scripts/extract_pdf_info.js` 파일의 정규식을 수정하여 추출 방식 변경 가능

### 엑셀 컬럼 추가/수정
`scripts/create_excel_from_pdf.js` 파일의 `excelData` 부분 수정

### 컬럼 너비 조정
`worksheet['!cols']` 배열에서 `wch` 값 수정

## 🐛 문제 해결

### PDF 읽기 실패
- PDF 파일명이 `*_price_info.pdf` 형식인지 확인
- PDF가 스캔본이 아닌 텍스트 PDF인지 확인

### 홈페이지 검색 실패
- 인터넷 연결 확인
- `--skip-website` 옵션으로 일단 건너뛰기

### 엑셀 파일 열리지 않음
- Microsoft Excel 또는 Numbers 설치 확인
- LibreOffice 등 다른 프로그램으로 시도

---

**생성일**: 2025-12-12  
**버전**: 1.0
