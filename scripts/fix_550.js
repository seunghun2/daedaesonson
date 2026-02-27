const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0550');

// e하늘 이미지 기준 전체 재구성
// 오석(일반) 개인 / 실버(일반) 개인 / 오석/장미목 부부 / 실버(부부) / 가족단
p.priceInfo.standardizedPrices = [
    // [0] 개인단
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // 오석일반
            { name: '1단/8단 (15년)', price: 1500000, feeType: 'USAGE', groupType: '오석일반', isRepresentative: true },
            { name: '1단/8단 (영성)', price: 3000000, feeType: 'USAGE', groupType: '오석일반' },
            { name: '2단/7단 (15년)', price: 1500000, feeType: 'USAGE', groupType: '오석일반' },
            { name: '2단/7단 (영성)', price: 3500000, feeType: 'USAGE', groupType: '오석일반' },
            { name: '3단/6단 (영성)', price: 4000000, feeType: 'USAGE', groupType: '오석일반' },
            { name: '4단/5단 (영성)', price: 4000000, feeType: 'USAGE', groupType: '오석일반' },
            // 실버일반
            { name: '1단/8단 (15년)', price: 1500000, feeType: 'USAGE', groupType: '실버일반' },
            { name: '1단/8단 (영성)', price: 3000000, feeType: 'USAGE', groupType: '실버일반' },
            { name: '2단/7단 (15년)', price: 1500000, feeType: 'USAGE', groupType: '실버일반' },
            { name: '2단/7단 (영성)', price: 3500000, feeType: 'USAGE', groupType: '실버일반' },
            { name: '3단/6단 (영성)', price: 4000000, feeType: 'USAGE', groupType: '실버일반' },
            { name: '4단/5단 (영성)', price: 4000000, feeType: 'USAGE', groupType: '실버일반' },
        ]
    },
    // [1] 부부단
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // 오석/장미목 부부
            { name: '1단/8단 (15년)', price: 3000000, feeType: 'USAGE', groupType: '오석/장미목' },
            { name: '1단/8단 (영성)', price: 6000000, feeType: 'USAGE', groupType: '오석/장미목' },
            { name: '2단/7단 (15년)', price: 3000000, feeType: 'USAGE', groupType: '오석/장미목' },
            { name: '2단/7단 (영성)', price: 7000000, feeType: 'USAGE', groupType: '오석/장미목' },
            { name: '3단/6단 (영성)', price: 8000000, feeType: 'USAGE', groupType: '오석/장미목' },
            { name: '4단/5단 (영성)', price: 8000000, feeType: 'USAGE', groupType: '오석/장미목' },
            // 실버 부부
            { name: '1단/8단 (15년)', price: 3000000, feeType: 'USAGE', groupType: '실버' },
            { name: '1단/8단 (영성)', price: 6000000, feeType: 'USAGE', groupType: '실버' },
            { name: '2단/7단 (15년)', price: 3000000, feeType: 'USAGE', groupType: '실버' },
            { name: '2단/7단 (영성)', price: 7000000, feeType: 'USAGE', groupType: '실버' },
            { name: '3단/6단 (영성)', price: 8000000, feeType: 'USAGE', groupType: '실버' },
            { name: '4단/5단 (영성)', price: 8000000, feeType: 'USAGE', groupType: '실버' },
        ]
    },
    // [2] 가족단
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(가족)',
        rows: [
            { name: '가족단 4위 (영성)', price: 16000000, feeType: 'USAGE', groupType: '가족단' },
            { name: '가족단 6위 (영성)', price: 24000000, feeType: 'USAGE', groupType: '가족단' },
            { name: '가족단 8위 (영성)', price: 29000000, feeType: 'USAGE', groupType: '가족단' },
        ]
    },
];

console.log('✅ 550 생극추모공원 전체 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 1개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
