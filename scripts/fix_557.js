const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0557');

// e하늘 이미지 기준 재구성
// 시설사용료: 가족봉안묘 3종
// 서비스항목: 일반형 봉안묘 세트 (사용료/관리비 별도)
// + 평안봉안묘(고급/일반)
// + 공작2단(봉안묘/일반형)

p.priceInfo.standardizedPrices = [
    // [0] 일반형(세트, 사용료·관리비 별도)
    {
        serviceType: 'BONGSAN',
        subType: '봉안묘(일반형)',
        rows: [
            { name: '평안봉안묘(일반형) 1세트', price: 8700000, feeType: 'USAGE', groupType: '일반형', isRepresentative: true },
            { name: '평안봉안묘(고급형) 1세트', price: 9300000, feeType: 'USAGE', groupType: '일반형' },
            { name: '공작2단(봉안묘/일반형) 1세트', price: 10400000, feeType: 'USAGE', groupType: '일반형' },
            { name: '다솜 1세트', price: 12300000, feeType: 'USAGE', groupType: '일반형' },
            { name: '다솜라운드 1세트', price: 12300000, feeType: 'USAGE', groupType: '일반형' },
            { name: '공작3단고급형 1세트', price: 12800000, feeType: 'USAGE', groupType: '일반형' },
            { name: '화목 1세트', price: 12800000, feeType: 'USAGE', groupType: '일반형' },
        ]
    },
    // [1] 가족봉안묘(사용금+15년관리비+시설물 포함)
    {
        serviceType: 'BONGSAN',
        subType: '가족봉안묘(패키지)',
        rows: [
            { name: '화목S(14.67㎡, 봉안8기)', price: 15400000, feeType: 'USAGE', groupType: '가족형' },
            { name: '다솜(26.44㎡, 봉안20기)', price: 24200000, feeType: 'USAGE', groupType: '가족형' },
            { name: '공작(33.05㎡, 봉안24기)', price: 28000000, feeType: 'USAGE', groupType: '가족형' },
        ]
    },
];

console.log('✅ 557 로엠 - e하늘 기준 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 9개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
