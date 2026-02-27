const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0553');

// 아코디언 2개: 개인 / 부부
// 관리비는 각 아코디언 안에 feeType: MAINTENANCE로 넣기 (하단 관리비 안내 박스로 자동 표시)
p.priceInfo.standardizedPrices = [
    // [0] 개인
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(개인)',
        rows: [
            // 천상담
            { name: '1단', price: 3370000, feeType: 'USAGE', groupType: '천상담' },
            { name: '2단', price: 4220000, feeType: 'USAGE', groupType: '천상담' },
            { name: '3단', price: 4220000, feeType: 'USAGE', groupType: '천상담' },
            { name: '4단', price: 4220000, feeType: 'USAGE', groupType: '천상담' },
            { name: '5단', price: 4220000, feeType: 'USAGE', groupType: '천상담' },
            { name: '6단', price: 4220000, feeType: 'USAGE', groupType: '천상담' },
            // 하늘담
            { name: '1단', price: 1700000, feeType: 'USAGE', groupType: '하늘담', isRepresentative: true },
            { name: '2단', price: 2200000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '3단', price: 2900000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '4단', price: 2900000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '5단', price: 2900000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '6단', price: 2900000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '7단', price: 2500000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '8단', price: 2100000, feeType: 'USAGE', groupType: '하늘담' },
            // 관리비 (10년, 1인)
            { name: '관리비(10년)', price: 500000, feeType: 'MAINTENANCE' },
        ]
    },
    // [1] 부부
    {
        serviceType: 'BONGSAN',
        subType: '봉안당(부부)',
        rows: [
            // 천상담
            { name: '1단', price: 5050000, feeType: 'USAGE', groupType: '천상담' },
            { name: '2단', price: 6330000, feeType: 'USAGE', groupType: '천상담' },
            { name: '3단', price: 6330000, feeType: 'USAGE', groupType: '천상담' },
            { name: '4단', price: 6330000, feeType: 'USAGE', groupType: '천상담' },
            { name: '5단', price: 6330000, feeType: 'USAGE', groupType: '천상담' },
            { name: '6단', price: 6330000, feeType: 'USAGE', groupType: '천상담' },
            // 하늘담
            { name: '1단', price: 2890000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '2단', price: 3740000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '3단', price: 4930000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '4단', price: 4930000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '5단', price: 4930000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '6단', price: 4930000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '7단', price: 4250000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '8단', price: 3570000, feeType: 'USAGE', groupType: '하늘담' },
            { name: '9단', price: 3060000, feeType: 'USAGE', groupType: '하늘담' },
            // 관리비 (10년, 2인)
            { name: '관리비(10년)', price: 700000, feeType: 'MAINTENANCE' },
        ]
    },
];

console.log('✅ 553 천주교안성추모공원 - 관리비를 아코디언 내부 MAINTENANCE로:');
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
