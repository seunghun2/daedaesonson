const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0560');

// 원래 DB 가격 유지 + 개인/부부 아코디언 분리 + 관리비 추가
p.priceInfo.standardizedPrices = [
    // [0] 봉안담(개인)
    {
        serviceType: 'BONGSAN',
        subType: '봉안담(개인)',
        rows: [
            { name: '9단', price: 4045000, feeType: 'USAGE', groupType: '개인', isRepresentative: true },
            { name: '8단', price: 4245000, feeType: 'USAGE', groupType: '개인' },
            { name: '7단', price: 4445000, feeType: 'USAGE', groupType: '개인' },
            { name: '6단', price: 4645000, feeType: 'USAGE', groupType: '개인' },
            { name: '5단', price: 4645000, feeType: 'USAGE', groupType: '개인' },
            { name: '4단', price: 4645000, feeType: 'USAGE', groupType: '개인' },
            { name: '3단', price: 4645000, feeType: 'USAGE', groupType: '개인' },
            { name: '2단', price: 4645000, feeType: 'USAGE', groupType: '개인' },
            { name: '1단', price: 4645000, feeType: 'USAGE', groupType: '개인' },
            { name: '관리비(2년 주기)', price: 58000, feeType: 'MAINTENANCE', note: '초기 5년 관리비 포함, 6년차부터 납부' },
        ]
    },
    // [1] 봉안담(부부)
    {
        serviceType: 'BONGSAN',
        subType: '봉안담(부부)',
        rows: [
            { name: '9단', price: 7042000, feeType: 'USAGE', groupType: '부부' },
            { name: '8단', price: 7342000, feeType: 'USAGE', groupType: '부부' },
            { name: '7단', price: 7642000, feeType: 'USAGE', groupType: '부부' },
            { name: '6단', price: 7842000, feeType: 'USAGE', groupType: '부부' },
            { name: '5단', price: 7842000, feeType: 'USAGE', groupType: '부부' },
            { name: '4단', price: 7842000, feeType: 'USAGE', groupType: '부부' },
            { name: '3단', price: 7842000, feeType: 'USAGE', groupType: '부부' },
            { name: '2단', price: 7842000, feeType: 'USAGE', groupType: '부부' },
            { name: '1단', price: 7842000, feeType: 'USAGE', groupType: '부부' },
            { name: '관리비(2년 주기)', price: 96800, feeType: 'MAINTENANCE', note: '초기 5년 관리비 포함, 6년차부터 납부' },
        ]
    },
    // [2] 봉안묘
    {
        serviceType: 'BONGSAN',
        subType: '봉안묘',
        rows: [
            { name: '데이지', price: 11949000, feeType: 'USAGE', groupType: '봉안묘' },
            { name: '아이리스', price: 15942000, feeType: 'USAGE', groupType: '봉안묘' },
            { name: '매그놀리아', price: 17924000, feeType: 'USAGE', groupType: '봉안묘' },
            { name: '오키드', price: 19898000, feeType: 'USAGE', groupType: '봉안묘' },
            { name: '로터스', price: 29847000, feeType: 'USAGE', groupType: '봉안묘' },
        ]
    },
];

console.log('✅ 560 분당메모리얼파크 - 원래 가격 복원 + 관리비 추가:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    console.log('  [' + i + '] ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
