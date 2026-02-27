const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0547');

// e하늘 장사정보 이미지 기준 전체 재구성
p.priceInfo.standardizedPrices = [
    // [0] 묘지 (매장묘/봉안묘)
    {
        serviceType: 'OTHER',
        subType: '묘지',
        rows: [
            { name: '매장묘/봉안묘 사용료', price: 1950000, feeType: 'USAGE', groupType: '매장묘·봉안묘', isRepresentative: true },
            { name: '관리비 (1년)', price: 27000, feeType: 'MAINTENANCE', groupType: '매장묘·봉안묘' },
        ]
    },
    // [1] 자연장 (평장)
    {
        serviceType: 'NATURAL',
        subType: '자연장',
        rows: [
            { name: '평장 2기', price: 14500000, feeType: 'USAGE', groupType: '평장' },
            { name: '평장 4기 (서향)', price: 19000000, feeType: 'USAGE', groupType: '평장' },
            { name: '평장 4기 (동향)', price: 18000000, feeType: 'USAGE', groupType: '평장' },
            { name: '평장 6기 (남향)', price: 26500000, feeType: 'USAGE', groupType: '평장' },
            { name: '평장 6기 (북향)', price: 24500000, feeType: 'USAGE', groupType: '평장' },
        ]
    },
    // [2] 봉안탑
    {
        serviceType: 'BONGSAN',
        subType: '봉안탑',
        rows: [
            { name: '봉안 2기 탑형', price: 17500000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 2기 탑형', price: 19500000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 4기 탑형', price: 19500000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 4기 탑형', price: 21500000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 6위 (자연장/남향)', price: 24000000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 6위 (자연장/북향)', price: 24000000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 8위', price: 32500000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 12위', price: 35500000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 16위', price: 39000000, feeType: 'USAGE', groupType: '봉안탑' },
            { name: '봉안 9위 (자연장)', price: 30000000, feeType: 'USAGE', groupType: '봉안탑' },
        ]
    },
    // [3] 봉안담
    {
        serviceType: 'BONGSAN',
        subType: '봉안담(개인)',
        rows: [
            { name: '1단', price: 2500000, feeType: 'USAGE', groupType: '개인단' },
            { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '개인단' },
            { name: '3단', price: 4500000, feeType: 'USAGE', groupType: '개인단' },
            { name: '4단', price: 4500000, feeType: 'USAGE', groupType: '개인단' },
            { name: '5단', price: 4000000, feeType: 'USAGE', groupType: '개인단' },
            { name: '6단', price: 2000000, feeType: 'USAGE', groupType: '개인단' },
        ]
    },
    // [4] 봉안담 부부
    {
        serviceType: 'BONGSAN',
        subType: '봉안담(부부)',
        rows: [
            { name: '1단', price: 4000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '2단', price: 5500000, feeType: 'USAGE', groupType: '부부단' },
            { name: '3단', price: 7000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '4단', price: 7000000, feeType: 'USAGE', groupType: '부부단' },
            { name: '5단', price: 5500000, feeType: 'USAGE', groupType: '부부단' },
            { name: '6단', price: 3000000, feeType: 'USAGE', groupType: '부부단' },
        ]
    },
];

console.log('✅ 547 (재)자하연 일산(봉안) 전체 재구성:');
let total = 0;
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    total += s.rows.length;
});
console.log('  총: ' + total + '개');

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
