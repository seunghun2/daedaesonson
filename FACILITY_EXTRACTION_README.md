# 시설 정보 추출 및 시각화 프로젝트

## 📋 개요

archive 폴더에 있는 시설들의 PDF 파일에서 정보를 추출하여 JSON 데이터로 저장하고, 
이를 시각적으로 멋진 SVG 카드로 만드는 자동화 프로젝트입니다.

## 🎯 추출되는 정보

각 시설의 PDF에서 다음 정보들을 추출합니다:

1. **번호 (no)**: 시설 고유 번호
2. **시설 유형 (facilityType)**: 사설, 공설, 법인, 종교 등
3. **이름 (name)**: 시설명
4. **홈페이지 (website)**: 공식 웹사이트 주소 (크롤링으로 검색 가능)
5. **주소 (address)**: 전체 주소
6. **전화번호 (phone)**: 대표 전화
7. **팩스번호 (fax)**: 팩스 번호
8. **총매장능력 (capacity)**: 수용 가능 매장 수
9. **편의시설 (amenities)**: 아이콘으로 표시되는 편의시설
10. **업데이트 (update)**: 마지막 업데이트 시점

## 📁 파일 구조

```
daedaesonson/
├── archive/                          # 원본 PDF가 있는 폴더
│   ├── 1.(재)낙원추모공원/
│   │   ├── 1.(재)낙원추모공원_price_info.pdf
│   │   └── photos/
│   ├── 10.재단법인 솥발산공원묘원/
│   └── ...
├── scripts/                          # 처리 스크립트들
│   ├── extract_pdf_info.js          # PDF 정보 추출
│   ├── find_facility_websites.js    # 홈페이지 검색 크롤러
│   ├── generate_facility_svg.js     # SVG 생성
│   └── run_full_process.js          # 전체 프로세스 실행
├── extracted_facility_info.json     # 추출된 데이터 (JSON)
└── facility_svg/                    # 생성된 SVG 파일들
    ├── _dashboard.svg               # 전체 대시보드
    ├── 1.(재)낙원추모공원.svg
    └── ...
```

## 🚀 사용 방법

### 1. 빠른 실행 (홈페이지 검색 제외)

```bash
node scripts/run_full_process.js --skip-website
```

이 명령은:
- ✅ PDF에서 정보 추출
- ⏭️ 홈페이지 검색 건너뛰기
- ✅ SVG 생성

**소요시간**: 약 1-2분 (10개 시설 기준)

### 2. 전체 실행 (홈페이지 검색 포함)

```bash
node scripts/run_full_process.js
```

이 명령은:
- ✅ PDF에서 정보 추출
- ✅ 네이버 검색으로 홈페이지 자동 크롤링
- ✅ SVG 생성

**소요시간**: 약 5-10분 (10개 시설 기준)
※ 각 시설마다 3초 딜레이가 있어 서버 부하를 방지합니다.

### 3. 개별 스크립트 실행

#### PDF 정보 추출만
```bash
node scripts/extract_pdf_info.js
```

#### 홈페이지 검색만
```bash
node scripts/find_facility_websites.js
```

#### SVG 생성만
```bash
node scripts/generate_facility_svg.js
```

### 4. 도움말 보기

```bash
node scripts/run_full_process.js --help
```

## 📊 출력 예시

### JSON 데이터 (extracted_facility_info.json)

```json
{
  "no": "1",
  "facilityType": "사설",
  "name": "(재)낙원추모공원",
  "website": "https://nakwon.example.com",
  "address": "경상남도 김해시 한림면 김해대로1402번길 148 (신천리)",
  "phone": "055-343-0656",
  "fax": "055-343-0650",
  "capacity": "30000",
  "amenities": [
    {
      "keyword": "편의시설",
      "icon": "🍴"
    }
  ],
  "update": "3개월전"
}
```

### SVG 카드

각 시설마다 다음과 같은 정보가 포함된 시각적 카드가 생성됩니다:
- 🏢 시설 타입 아이콘
- 🔢 시설 번호 배지
- 📝 시설명
- 📍 주소
- 📞 전화번호
- 📠 팩스번호
- 📊 총매장능력
- 🌐 홈페이지 (있는 경우)
- ⭐ 편의시설 아이콘들
- 🕐 업데이트 정보

## 🎨 SVG 디자인 특징

- **그라데이션 배경**: 보라색 계열의 세련된 그라데이션
- **카드 레이아웃**: 모던하고 깔끔한 카드 디자인
- **색상 코딩**: 시설 타입별 다른 아이콘 사용
  - 🏢 사설
  - 🏛️ 공설/법인
  - ⛪ 종교
- **반응형 아이콘**: 이모지를 활용한 직관적인 정보 표시
- **그림자 효과**: depth를 주는 드롭 섀도우

## 🔍 홈페이지 크롤링 기능

`find_facility_websites.js` 스크립트는 다음과 같이 작동합니다:

1. **네이버 검색**: "{시설명} 홈페이지" 검색
2. **링크 필터링**: 공식 사이트로 보이는 링크만 추출
3. **제외 도메인**: 블로그, 카페, SNS 등 제외
4. **자동 저장**: 5개마다 자동으로 중간 저장
5. **딜레이 관리**: 각 검색 사이 3초 대기

## 📈 전체 처리 통계

현재 테스트 결과 (10개 시설):
- ✅ 처리된 시설: 10개
- 📄 추출된 PDF: 10개
- 🎨 생성된 SVG: 11개 (개별 10개 + 대시보드 1개)
- ⏱️ 평균 처리 시간: 약 10초/시설

## 🛠️ 수정 및 커스터마이징

### PDF 추출 패턴 수정

`scripts/extract_pdf_info.js` 파일의 정규식 패턴을 수정하여 
추출 방식을 변경할 수 있습니다.

### SVG 디자인 변경

`scripts/generate_facility_svg.js` 파일에서:
- 색상 변경: `linearGradient` 부분 수정
- 레이아웃 변경: x, y 좌표 수정
- 폰트 변경: `font-family` 속성 수정
- 크기 변경: `width`, `height` 파라미터 수정

### 크롤링 로직 수정

`scripts/find_facility_websites.js` 파일에서:
- 검색 엔진 변경 가능 (현재: 네이버)
- 필터링 조건 수정 가능
- 딜레이 시간 조정 가능

## ⚠️ 주의사항

1. **대량 처리 시**: 홈페이지 크롤링은 시간이 오래 걸립니다. 
   처음에는 `--skip-website` 옵션으로 테스트하세요.

2. **API 제한**: 너무 빠른 크롤링은 IP 차단을 유발할 수 있습니다. 
   현재 3초 딜레이가 설정되어 있습니다.

3. **PDF 포맷**: PDF 텍스트 추출이 실패하면 정규식 패턴을 조정해야 할 수 있습니다.

4. **메모리**: 대량의 시설(1000개 이상)을 처리할 때는 
   `extract_pdf_info.js`의 `.slice(0, 10)` 부분을 수정하세요.

## 📝 TODO

- [ ] 전체 1498개 시설에 대해 실행
- [ ] 홈페이지 크롤링 정확도 개선
- [ ] SVG를 PNG/JPG로 변환하는 기능 추가
- [ ] 데이터베이스 연동
- [ ] 웹 대시보드 구축

## 💡 팁

- **미리보기**: `open facility_svg/_dashboard.svg` 명령으로 대시보드 확인
- **데이터 검증**: `cat extracted_facility_info.json | jq .` 로 JSON 예쁘게 보기
- **진행 상황**: 스크립트 실행 중 콘솔에서 실시간 진행 상황 확인 가능

---

*생성일: 2025-12-12*
*버전: 1.0*
