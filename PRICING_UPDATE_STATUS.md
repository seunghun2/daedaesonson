# 가격 데이터 업데이트 현황

## 📊 현재 진행 상황

### ✅ 완료된 작업 (2025-12-27)

**총 28개 시설 업데이트 완료**

#### 1차 작업 - Items 657-660, 700-720 (7개 시설)
- Item 657: park-0014 (자하연 일산) - 28개 행
- Item 658-660: park-0010, park-0012, park-0013 (솥발산, 화산추모, 서울공원)
- Item 700, 710, 720

#### 2차 작업 - 카테고리 정리 (4개 시설)
- park-0018 (보령시모란공원): 단장형/합장형 분리
- park-0025 (금릉공원묘원): 기타/제외됨 제거
- park-0030 (풍산공원묘원): 매장묘/봉안묘 재분류
- park-0561 (금릉공원묘원 봉안당): 개인/부부 그룹화

#### 3차 작업 - 추가 정리 (3개 시설)
- park-0034 (삼척시추모공원): 2평형/3평형 그룹화
- park-0042 (별그리다): 단장형/합장형 + 일반/THE PROUD
- park-0055 (동해시하늘정원): 단장형/합장형 + 관내

#### 4차 작업 - 데이터 입력 (6개 시설)
- park-0061 (고성군 공설묘원): 단장형/합장형 재구성
- park-0065 (광주구천주교공원묘원): 매장묘/평장묘 입력
- park-0074 (창원공원묘원): 매장묘/봉안묘/평장묘/수목형
- park-0087 (서라벌공원묘원): 매장묘/봉안묘/평장묘
- park-0605 (남한강공원묘원): 봉안묘 그룹화
- park-1251 (남한강공원묘원): 매장묘/평장묘

#### 5차 작업 - 최종 정리 (8개 시설)
- park-0089 (여수시공설묘지): 일반시민/특례자
- park-0096 (전주효자공원): 최초 30년/5년 연장
- park-0094 (예래원): 매장묘/석물
- park-0121 (춘천안식공원): 봉안당 → 단장형/합장형
- park-0119 (청양군추모공원): 단장형/합장형
- park-0126 (충주시공설묘지): 단장형/합장형
- park-0136 (인제종합장묘센터): 구조 정리

---

## 🎯 다음 작업 시작점

### **Item 709부터 시작**

**작업 대기 중:**
- 강릉공원묘원 (별도 처리 예정)

---

## 📝 작업 프로세스

### 1. Item 번호로 시설 찾기

```bash
# CSV에서 Item 709 데이터 확인
node -e "const fs = require('fs'); const csv = fs.readFileSync('data/goifuneral_prices.csv', 'utf8'); const lines = csv.split('\n').filter(l => l.startsWith('709,')); lines.forEach(l => console.log(l));"
```

### 2. 시설 ID 찾기

```bash
# 시설명으로 ID 검색
node -e "const fs = require('fs'); const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8')); const f = data.find(d => d.name && d.name.includes('시설명')); console.log('ID:', f?.id, 'Name:', f?.name);"
```

### 3. 현재 데이터 확인

```bash
# API로 현재 데이터 조회
curl -s http://localhost:3000/api/facilities 2>/dev/null | node -e "const data = require('fs').readFileSync(0, 'utf-8'); const json = JSON.parse(data); const f = json.find(x => x.id === 'park-XXXX'); console.log(JSON.stringify(f?.priceInfo, null, 2));"
```

### 4. 스크립트 작성 패턴

```javascript
const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facility = facilities.find(f => f.id === 'park-XXXX');

if (!facility) {
  console.log('❌ park-XXXX not found');
  process.exit(1);
}

// 데이터 구조화 (필요에 따라 선택)
// 1. 단장형/합장형 분리
// 2. groupType 사용 (일반/특례자, 관내/관외, 개인/부부 등)
// 3. priceTable 키로 1차 분류 (단장형/합장형)

const rows단장형 = [
  { name: '사용료', price: 0, grade: '', groupType: '일반', isRepresentative: true },
  // ...
];

const rows합장형 = [
  { name: '사용료', price: 0, grade: '', groupType: '일반', isRepresentative: true },
  // ...
];

const payload = {
  id: facility.id,
  name: facility.name,
  address: facility.address,
  category: facility.category,
  coordinates: facility.coordinates,
  priceInfo: {
    priceTable: {
      단장형: { unit: '원', rows: rows단장형 },
      합장형: { unit: '원', rows: rows합장형 }
    }
  }
};

async function update() {
  const response = await fetch('http://localhost:3000/api/facilities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const result = await response.json();
  console.log(result.error ? `❌ ${result.error}` : `✅ ${facility.name}`);
}

update();
```

### 5. 실행 및 검증

```bash
node scripts/update_park_XXXX.js
```

### 6. 커밋

```bash
git add .
git commit -m "feat: Update pricing data for park-XXXX (Item 709)"
git push origin main
```

---

## 🎨 데이터 구조 패턴

### A. 단장형/합장형 분리 (기본)
```javascript
priceTable: {
  단장형: { unit: '원', rows: [...] },
  합장형: { unit: '원', rows: [...] }
}
```

### B. groupType 활용 (2차 그룹화)
```javascript
rows: [
  { name: '사용료', price: 100000, groupType: '일반', isRepresentative: true },
  { name: '사용료', price: 150000, groupType: '특례자', isRepresentative: false }
]
```

### C. 복합 카테고리
```javascript
priceTable: {
  매장묘: { unit: '원', rows: [...] },
  봉안묘: { unit: '원', rows: [...] },
  평장묘: { unit: '원', rows: [...] }
}
```

### D. 2-depth 아코디언 (priceTable 키 + groupType)
```javascript
priceTable: {
  단장형: {
    unit: '원',
    rows: [
      { name: '사용료', groupType: '관내', ... },
      { name: '사용료', groupType: '관외', ... }
    ]
  }
}
```

---

## ⚠️ 주의사항

1. **isRepresentative: true** - 각 카테고리당 1개만 설정
2. **groupType** - 관내/관외, 일반/특례자, 개인/부부 등에만 사용
3. **priceTable 키** - 단장형/합장형/매장묘/봉안묘/평장묘 등 정확한 카테고리명 사용
4. **grade** - 상세 정보 (면적, 기간 등)
5. **기타/제외됨 카테고리 사용 금지**

---

## 📌 체크리스트

- [ ] Item 709 CSV 데이터 확인
- [ ] 시설 ID 찾기
- [ ] 현재 데이터 확인
- [ ] 스크립트 작성
- [ ] 실행 및 검증
- [ ] 커밋 & 푸시

---

**Last Updated**: 2025-12-27 13:17  
**Next Item**: 709  
**Session Progress**: Items 1-701 완료 (28개 시설)
