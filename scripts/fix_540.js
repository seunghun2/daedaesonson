const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0540');

// 사이트에서 추출한 전체 데이터 (단위: 만원 → ×10000)
// 봉안당 6개 서브탭 + 수목장 + 야외안치단 + 산골장 + 단체전용관

p.priceInfo.standardizedPrices = [
    // ===== [0] 봉안당(개인) =====
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // --- 일반실(브론즈단) ---
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '3단', price: 5000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '일반실(브론즈단)', isRepresentative: true },
            { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '7단', price: 4500000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            // --- 일반실(향나무단) --- 동일 가격
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '3단', price: 5000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '7단', price: 4500000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            // --- 고급실(티타늄단) ---
            { name: '1단', price: 5000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '2단', price: 6000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '4단', price: 9000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '7단', price: 5500000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            // --- 고급실(브론즈단) ---
            { name: '1단', price: 4500000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '3단', price: 5500000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '4단', price: 6500000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '6단', price: 6500000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '7단', price: 5000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '8단', price: 4500000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            // --- 헤리티지관(지상) ---
            { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '3단', price: 4500000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '4단', price: 5500000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '6단', price: 5500000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            // --- 헤리티지관(지하) ---
            { name: '1단', price: 1800000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '2단', price: 2500000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '3단', price: 3000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '4단', price: 3500000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '5단', price: 3500000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '6단', price: 3500000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '7단', price: 2500000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '8단', price: 2000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            // --- 특별실(기독교·천주교) ---
            { name: '1단', price: 5500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2단', price: 5500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3단', price: 6000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 7000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 7500000, feeType: 'USAGE', groupType: '특별실' },
            { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '특별실' },
            // --- 관리비 ---
            { name: '관리비 (일반실/년)', price: 70000, feeType: 'MAINTENANCE', groupType: '일반실' },
            { name: '관리비 (고급실/년)', price: 90000, feeType: 'MAINTENANCE', groupType: '고급실' },
            { name: '관리비 (헤리티지관/년)', price: 60000, feeType: 'MAINTENANCE', groupType: '헤리티지관' },
            { name: '관리비 (특별실/년)', price: 60000, feeType: 'MAINTENANCE', groupType: '특별실' },
            { name: '관리비 (고급실브론즈/년)', price: 80000, feeType: 'MAINTENANCE', groupType: '고급실(브론즈단)' },
        ]
    },
    // ===== [1] 봉안당(부부) =====
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // --- 일반실(브론즈단) ---
            { name: '1단', price: 6000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '4단', price: 12000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '5단', price: 14000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '7단', price: 9000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            { name: '8단', price: 7000000, feeType: 'USAGE', groupType: '일반실(브론즈단)' },
            // --- 일반실(향나무단) ---
            { name: '1단', price: 6000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '4단', price: 12000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '5단', price: 14000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '7단', price: 9000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            { name: '8단', price: 7000000, feeType: 'USAGE', groupType: '일반실(향나무단)' },
            // --- 고급실(티타늄단) ---
            { name: '1단', price: 10000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '2단', price: 12000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '3단', price: 16000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '4단', price: 18000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '5단', price: 20000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '6단', price: 14000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            { name: '7단', price: 11000000, feeType: 'USAGE', groupType: '고급실(티타늄단)' },
            // --- 고급실(브론즈단) ---
            { name: '1단', price: 9000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '2단', price: 10000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '3단', price: 11000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '4단', price: 13000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '5단', price: 14000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '6단', price: 13000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '7단', price: 10000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            { name: '8단', price: 9000000, feeType: 'USAGE', groupType: '고급실(브론즈단)' },
            // --- 헤리티지관(지상) ---
            { name: '1단', price: 7000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '3단', price: 9000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '4단', price: 11000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '5단', price: 12000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '6단', price: 11000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            { name: '8단', price: 7000000, feeType: 'USAGE', groupType: '헤리티지관(지상)' },
            // --- 헤리티지관(지하) ---
            { name: '1단', price: 3600000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '3단', price: 6000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '4단', price: 7000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '7단', price: 5000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            { name: '8단', price: 4000000, feeType: 'USAGE', groupType: '헤리티지관(지하)' },
            // --- 특별실 부부단 ---
            { name: '1단', price: 11000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '2단', price: 11000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '3단', price: 12000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '4단', price: 14000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '5단', price: 15000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '6단', price: 14000000, feeType: 'USAGE', groupType: '특별실' },
            { name: '7단', price: 12000000, feeType: 'USAGE', groupType: '특별실' },
            // --- 관리비 ---
            { name: '관리비 (일반실/년)', price: 140000, feeType: 'MAINTENANCE', groupType: '일반실' },
            { name: '관리비 (고급실/년)', price: 180000, feeType: 'MAINTENANCE', groupType: '고급실' },
            { name: '관리비 (헤리티지관/년)', price: 120000, feeType: 'MAINTENANCE', groupType: '헤리티지관' },
            { name: '관리비 (특별실/년)', price: 120000, feeType: 'MAINTENANCE', groupType: '특별실' },
            { name: '관리비 (고급실브론즈/년)', price: 160000, feeType: 'MAINTENANCE', groupType: '고급실(브론즈단)' },
        ]
    },
    // ===== [2] 수목장 =====
    {
        serviceType: 'NATURAL',
        subType: '수목장',
        rows: [
            // 유토피아솔파크
            { name: '개인형 (1기)', price: 6500000, feeType: 'USAGE', groupType: '유토피아솔파크' },
            { name: '부부형 (2기)', price: 10000000, feeType: 'USAGE', groupType: '유토피아솔파크' },
            { name: '가족형 (4기)', price: 20000000, feeType: 'USAGE', groupType: '유토피아솔파크' },
            { name: '가족형 스페셜 (4기)', price: 25000000, feeType: 'USAGE', groupType: '유토피아솔파크' },
            { name: '중가족형 (6기)', price: 28000000, feeType: 'USAGE', groupType: '유토피아솔파크' },
            { name: '대가족형 (8기)', price: 32000000, feeType: 'USAGE', groupType: '유토피아솔파크' },
            { name: '대가족형 스페셜 (10기)', price: 40000000, feeType: 'USAGE', groupType: '유토피아솔파크' },
            // 하늘공원/NP - 일반수목
            { name: '공동형 (1기)', price: 1500000, feeType: 'USAGE', groupType: '하늘공원(일반수목)' },
            { name: '표준가족형 (4기)', price: 7000000, feeType: 'USAGE', groupType: '하늘공원(일반수목)' },
            // 하늘공원/NP - 소나무
            { name: '표준가족형 (4기)', price: 12000000, feeType: 'USAGE', groupType: '하늘공원(소나무)' },
            { name: '대가족형 (8기)', price: 19000000, feeType: 'USAGE', groupType: '하늘공원(소나무)' },
            // 안장 작업비
            { name: '안장작업비 (1기당)', price: 400000, feeType: 'USAGE', groupType: '부가비용' },
            // 관리비
            { name: '관리비 개인/부부 (년)', price: 90000, feeType: 'MAINTENANCE', groupType: '유토피아솔파크' },
            { name: '관리비 가족형 (년)', price: 140000, feeType: 'MAINTENANCE', groupType: '유토피아솔파크' },
            { name: '관리비 공동형 (년)', price: 30000, feeType: 'MAINTENANCE', groupType: '하늘공원' },
            { name: '관리비 가족형 (년)', price: 70000, feeType: 'MAINTENANCE', groupType: '하늘공원' },
        ]
    },
    // ===== [3] 야외 안치단 =====
    {
        serviceType: 'BONGSAN',
        subType: '야외 안치단',
        rows: [
            { name: '가족형 (12위)', price: 72000000, feeType: 'USAGE', groupType: '야외 안치단' },
            { name: '관리비 (10년 선납)', price: 1800000, feeType: 'MAINTENANCE', groupType: '야외 안치단' },
        ]
    },
    // ===== [4] 산골장(유택동산) =====
    {
        serviceType: 'NATURAL',
        subType: '산골장(유택동산)',
        rows: [
            { name: '사용료 (3년)', price: 300000, feeType: 'USAGE', groupType: '산골장' },
            { name: '추모 예식실', price: 30000, feeType: 'USAGE', groupType: '부가옵션' },
        ]
    },
    // ===== [5] 단체 전용관(시립) =====
    {
        serviceType: 'BONGSAN',
        subType: '시립 전용관',
        rows: [
            { name: '2~7단 (영구)', price: 2800000, feeType: 'USAGE', groupType: '시립 전용관' },
            { name: '1단, 8단 (10년)', price: 800000, feeType: 'USAGE', groupType: '시립 전용관' },
            { name: '관리비 (년)', price: 60000, feeType: 'MAINTENANCE', groupType: '시립 전용관' },
        ]
    },
];

const indCount = p.priceInfo.standardizedPrices[0].rows.length;
const couCount = p.priceInfo.standardizedPrices[1].rows.length;
const natCount = p.priceInfo.standardizedPrices[2].rows.length;
const outCount = p.priceInfo.standardizedPrices[3].rows.length;
const scaCount = p.priceInfo.standardizedPrices[4].rows.length;
const munCount = p.priceInfo.standardizedPrices[5].rows.length;

console.log('✅ 540 유토피아추모공원 전체 재구성:');
console.log('   봉안당(개인): ' + indCount + '개');
console.log('   봉안당(부부): ' + couCount + '개');
console.log('   수목장: ' + natCount + '개');
console.log('   야외안치단: ' + outCount + '개');
console.log('   산골장: ' + scaCount + '개');
console.log('   시립전용관: ' + munCount + '개');
console.log('   총: ' + (indCount + couCount + natCount + outCount + scaCount + munCount) + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
