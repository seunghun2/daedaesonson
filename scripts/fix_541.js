const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0541');

// 대원전 봉안 가격 안내 (2024년 1월 1일)
// 이미지 기준 정확한 데이터

p.priceInfo.standardizedPrices = [
    // ===== [0] 봉안당(개인) =====
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // --- 2층 특실 (1~4실, 23~27실) ---
            { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '3·4·5단', price: 6000000, feeType: 'USAGE', groupType: '2층 특실', isRepresentative: true },
            { name: '창밑', price: 6000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '6단', price: 5000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '2층 특실' },
            // --- 2층 로얄실 (5실,11~18실,19~21개인) ---
            { name: '1단', price: 3300000, feeType: 'USAGE', groupType: '2층 로얄실' },
            { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '2층 로얄실' },
            { name: '3·4·5단', price: 5000000, feeType: 'USAGE', groupType: '2층 로얄실' },
            { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '2층 로얄실' },
            { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '2층 로얄실' },
            // --- 2층 고급실 (6실,10실) ---
            { name: '1단', price: 2300000, feeType: 'USAGE', groupType: '2층 고급실' },
            { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '2층 고급실' },
            { name: '3·4·5단', price: 4000000, feeType: 'USAGE', groupType: '2층 고급실' },
            { name: '6단', price: 3000000, feeType: 'USAGE', groupType: '2층 고급실' },
            { name: '7단', price: 2500000, feeType: 'USAGE', groupType: '2층 고급실' },
            // --- 1층 봉안실 ---
            { name: '1단', price: 1800000, feeType: 'USAGE', groupType: '1층 봉안실' },
            { name: '2단', price: 2300000, feeType: 'USAGE', groupType: '1층 봉안실' },
            { name: '3·4단', price: 3500000, feeType: 'USAGE', groupType: '1층 봉안실' },
            { name: '5단', price: 3000000, feeType: 'USAGE', groupType: '1층 봉안실' },
        ]
    },
    // ===== [1] 봉안당(부부) =====
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // --- 2층 특실 ---
            { name: '1단', price: 8000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '2단', price: 10000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '3·4·5단', price: 12000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '창밑', price: 12000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '6단', price: 10000000, feeType: 'USAGE', groupType: '2층 특실' },
            { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '2층 특실' },
            // --- 2층 로얄실 ---
            { name: '1단', price: 6500000, feeType: 'USAGE', groupType: '2층 로얄실' },
            { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '2층 로얄실' },
            { name: '3·4·5단', price: 10000000, feeType: 'USAGE', groupType: '2층 로얄실' },
            { name: '6단', price: 8000000, feeType: 'USAGE', groupType: '2층 로얄실' },
            { name: '7단', price: 7000000, feeType: 'USAGE', groupType: '2층 로얄실' },
            // --- 2층 고급실 ---
            { name: '1단', price: 4500000, feeType: 'USAGE', groupType: '2층 고급실' },
            { name: '2단', price: 6000000, feeType: 'USAGE', groupType: '2층 고급실' },
            { name: '3·4·5단', price: 8000000, feeType: 'USAGE', groupType: '2층 고급실' },
            { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '2층 고급실' },
            { name: '7단', price: 5000000, feeType: 'USAGE', groupType: '2층 고급실' },
            // --- 1층 봉안실 ---
            { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '1층 봉안실' },
            { name: '2단', price: 4500000, feeType: 'USAGE', groupType: '1층 봉안실' },
            { name: '3·4단', price: 5500000, feeType: 'USAGE', groupType: '1층 봉안실' },
            { name: '5단', price: 4500000, feeType: 'USAGE', groupType: '1층 봉안실' },
            { name: '6단', price: 3500000, feeType: 'USAGE', groupType: '1층 봉안실' },
            { name: '7단', price: 3000000, feeType: 'USAGE', groupType: '1층 봉안실' },
        ]
    },
];

const ic = p.priceInfo.standardizedPrices[0].rows.length;
const cc = p.priceInfo.standardizedPrices[1].rows.length;
console.log('✅ 541 영모묘원 수정:');
console.log('   개인: ' + ic + '개 (2층특실6+로얄5+고급5+1층4)');
console.log('   부부: ' + cc + '개 (2층특실6+로얄5+고급5+1층6)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
