const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0534');
const sp = p.priceInfo.standardizedPrices;

// [0] 봉안당(개인) — 실제 가격표 기준
sp[0].rows = [
    { name: '1단', price: 2000000, feeType: 'USAGE', groupType: '일반실', isRepresentative: true },
    { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '3단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '4단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '5단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '6단', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '8단(반야실)', price: 2500000, feeType: 'USAGE', groupType: '일반실' },
    { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '3단', price: 5500000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '4단', price: 5500000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '5단', price: 5500000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '6단', price: 5500000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '7단', price: 4500000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '관리비 (1년/1위)', price: 32000, feeType: 'MAINTENANCE' },
];

// [1] 봉안당(부부) — 개인 × 2
sp[1].rows = [
    { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '2단', price: 6000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '3단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '4단', price: 10000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '5단', price: 10000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '6단', price: 10000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '8단(반야실)', price: 5000000, feeType: 'USAGE', groupType: '일반실' },
    { name: '1단', price: 5000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '2단', price: 7000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '3단', price: 11000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '4단', price: 11000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '5단', price: 11000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '6단', price: 11000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '7단', price: 9000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '8단', price: 6000000, feeType: 'USAGE', groupType: '화엄실' },
    { name: '관리비 (1년/1위)', price: 64000, feeType: 'MAINTENANCE' },
];

// [2] 수목장 추가
const sumok = sp.find(s => s.serviceType === 'SUMOKJANG' && s.subType === '수목장');
if (!sumok) {
    sp.push({
        serviceType: 'SUMOKJANG',
        subType: '수목장',
        rows: [
            { name: '개인장지 (1기)', price: 2000000, feeType: 'USAGE', groupType: '수목', isRepresentative: true },
            { name: '옥향,잔디 (2기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
            { name: '에메랄드 그린 (4기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
            { name: '반송(小) (4기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
            { name: '반송(大) (12기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
            { name: '소나무 (12기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
            { name: '자연장', price: 0, feeType: 'USAGE', groupType: '자연' },
            { name: '관리비 (수목/년)', price: 21400, feeType: 'MAINTENANCE', groupType: '수목' },
            { name: '자연장 관리비', price: 0, feeType: 'MAINTENANCE', groupType: '자연' },
        ]
    });
} else {
    sumok.rows = [
        { name: '개인장지 (1기)', price: 2000000, feeType: 'USAGE', groupType: '수목', isRepresentative: true },
        { name: '옥향,잔디 (2기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
        { name: '에메랄드 그린 (4기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
        { name: '반송(小) (4기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
        { name: '반송(大) (12기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
        { name: '소나무 (12기)', price: 2000000, feeType: 'USAGE', groupType: '수목' },
        { name: '자연장', price: 0, feeType: 'USAGE', groupType: '자연' },
        { name: '관리비 (수목/년)', price: 21400, feeType: 'MAINTENANCE', groupType: '수목' },
        { name: '자연장 관리비', price: 0, feeType: 'MAINTENANCE', groupType: '자연' },
    ];
}

console.log('✅ 534 수정 완료 (실제 가격표 + 수목장):');
console.log('   개인: ' + sp[0].rows.length + '개');
console.log('   부부: ' + sp[1].rows.length + '개');
console.log('   수목장: ' + sp[2].rows.length + '개 (수목 6종 + 자연장 + 관리비)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
