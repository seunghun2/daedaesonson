const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0572');

// 공식 사이트 기준 (금상동성당 하늘자리)
// 지상 1층/2층 45년분 / 지하층 20년분
// 1인 봉안함(30×30×30cm) / 2인 봉안함(56×30×30cm)
// 사용료와 관리비 별도

p.priceInfo.standardizedPrices = [
    // ===== 지상(45년) =====
    {
        serviceType: 'BONGSAN', subType: '지상(45년/1인)',
        rows: [
            { name: '1단', price: 1600000, feeType: 'USAGE', groupType: '지상 1인', isRepresentative: true },
            { name: '2단', price: 1600000, feeType: 'USAGE', groupType: '지상 1인' },
            { name: '3단', price: 1800000, feeType: 'USAGE', groupType: '지상 1인' },
            { name: '4단', price: 2000000, feeType: 'USAGE', groupType: '지상 1인' },
            { name: '5단', price: 2000000, feeType: 'USAGE', groupType: '지상 1인' },
            { name: '6단', price: 2000000, feeType: 'USAGE', groupType: '지상 1인' },
            { name: '7단', price: 1800000, feeType: 'USAGE', groupType: '지상 1인' },
            { name: '8단', price: 1800000, feeType: 'USAGE', groupType: '지상 1인' },
            { name: '관리비(45년)', price: 2000000, feeType: 'MAINTENANCE', note: '1인 봉안함 기준' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '지상(45년/2인)',
        rows: [
            { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '지상 2인' },
            { name: '2단', price: 3000000, feeType: 'USAGE', groupType: '지상 2인' },
            { name: '3단', price: 3400000, feeType: 'USAGE', groupType: '지상 2인' },
            { name: '4단', price: 3800000, feeType: 'USAGE', groupType: '지상 2인' },
            { name: '5단', price: 3800000, feeType: 'USAGE', groupType: '지상 2인' },
            { name: '6단', price: 3800000, feeType: 'USAGE', groupType: '지상 2인' },
            { name: '7단', price: 3400000, feeType: 'USAGE', groupType: '지상 2인' },
            { name: '8단', price: 3400000, feeType: 'USAGE', groupType: '지상 2인' },
            { name: '관리비(45년)', price: 4000000, feeType: 'MAINTENANCE', note: '2인 봉안함 기준' },
        ]
    },
    // ===== 지하(20년) =====
    {
        serviceType: 'BONGSAN', subType: '지하(20년/1인)',
        rows: [
            { name: '1단', price: 1200000, feeType: 'USAGE', groupType: '지하 1인' },
            { name: '2단', price: 1200000, feeType: 'USAGE', groupType: '지하 1인' },
            { name: '3단', price: 1300000, feeType: 'USAGE', groupType: '지하 1인' },
            { name: '4단', price: 1500000, feeType: 'USAGE', groupType: '지하 1인' },
            { name: '5단', price: 1500000, feeType: 'USAGE', groupType: '지하 1인' },
            { name: '6단', price: 1500000, feeType: 'USAGE', groupType: '지하 1인' },
            { name: '7단', price: 1300000, feeType: 'USAGE', groupType: '지하 1인' },
            { name: '8단', price: 1300000, feeType: 'USAGE', groupType: '지하 1인' },
            { name: '관리비(20년)', price: 1400000, feeType: 'MAINTENANCE', note: '1인 봉안함 기준' },
        ]
    },
    {
        serviceType: 'BONGSAN', subType: '지하(20년/2인)',
        rows: [
            { name: '1단', price: 2200000, feeType: 'USAGE', groupType: '지하 2인' },
            { name: '2단', price: 2200000, feeType: 'USAGE', groupType: '지하 2인' },
            { name: '3단', price: 2400000, feeType: 'USAGE', groupType: '지하 2인' },
            { name: '4단', price: 2800000, feeType: 'USAGE', groupType: '지하 2인' },
            { name: '5단', price: 2800000, feeType: 'USAGE', groupType: '지하 2인' },
            { name: '6단', price: 2800000, feeType: 'USAGE', groupType: '지하 2인' },
            { name: '7단', price: 2400000, feeType: 'USAGE', groupType: '지하 2인' },
            { name: '8단', price: 2400000, feeType: 'USAGE', groupType: '지하 2인' },
            { name: '관리비(20년)', price: 2800000, feeType: 'MAINTENANCE', note: '2인 봉안함 기준' },
        ]
    },
];

console.log('✅ 572 금상동성당 하늘자리 - 공식 사이트 기준:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 18개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
