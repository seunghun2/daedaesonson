const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0559');

// e하늘 이미지 기준 전체 재구성
// 개인: 하늘1관2관 / 하늘3관5관 각 단별
// 부부: 하늘1관2관 / 하늘3관5관 각 단별
// 관리비: 연 5만(10년 50만 선납)

p.priceInfo.standardizedPrices = [
    // [0] 개인
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // 하늘1관,2관
            { name: '2~6단', price: 5000000, feeType: 'USAGE', groupType: '하늘1·2관' },
            { name: '4~5단', price: 7000000, feeType: 'USAGE', groupType: '하늘1·2관' },
            { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '하늘1·2관' },
            { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '하늘1·2관', isRepresentative: true },
            // 하늘3관,5관
            { name: '2~6단', price: 5000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            { name: '3~4단', price: 7000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            { name: '7단', price: 3000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            { name: '8단', price: 2000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            // 1단
            { name: '1단(하늘1·2관)', price: 5000000, feeType: 'USAGE', groupType: '1단' },
            { name: '1단(하늘3·5·6·7·8관)', price: 5000000, feeType: 'USAGE', groupType: '1단' },
            // 3단
            { name: '3단(하늘1·2관,6·7·8관)', price: 12000000, feeType: 'USAGE', groupType: '3단(특)' },
            { name: '3단(하늘3·5·6·7·8관)', price: 6000000, feeType: 'USAGE', groupType: '3단(특)' },
            // 관리비
            { name: '관리비(연 5만원, 10년 50만 선납)', price: 500000, feeType: 'MAINTENANCE' },
        ]
    },
    // [1] 부부
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // 하늘1관,2관,6관,7관,8관
            { name: '2~6단', price: 10000000, feeType: 'USAGE', groupType: '하늘1·2관' },
            { name: '4~5단', price: 14000000, feeType: 'USAGE', groupType: '하늘1·2관' },
            { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '하늘1·2관' },
            { name: '8단', price: 6000000, feeType: 'USAGE', groupType: '하늘1·2관' },
            // 하늘3관,5관
            { name: '2~6단', price: 10000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            { name: '5단', price: 12000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            { name: '3~4단', price: 14000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            { name: '8단', price: 4000000, feeType: 'USAGE', groupType: '하늘3·5관' },
            // 1단
            { name: '1단(하늘1·2관)', price: 10000000, feeType: 'USAGE', groupType: '1단' },
            { name: '1단(하늘3·5·6·7·8관)', price: 10000000, feeType: 'USAGE', groupType: '1단' },
            // 3단
            { name: '3단(하늘1·2관,6·7·8관)', price: 12000000, feeType: 'USAGE', groupType: '3단(특)' },
            { name: '3단(하늘3·5·6·7·8관)', price: 6000000, feeType: 'USAGE', groupType: '3단(특)' },
            // 관리비
            { name: '관리비(연 5만원, 10년 50만 선납)', price: 500000, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 559 극락사추모공원 - 전체 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    const usage = s.rows.filter(r => r.feeType === 'USAGE').length;
    const mgmt = s.rows.filter(r => r.feeType === 'MAINTENANCE').length;
    console.log('  [' + i + '] ' + s.subType + ': 사용료 ' + usage + '개 + 관리비 ' + mgmt + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개 (기존 7개 → ' + total + '개)');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
