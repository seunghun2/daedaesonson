const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const p = data.find(x => x.id === 'park-0543');

p.priceInfo.standardizedPrices = [
    // [0] 봉안묘
    {
        serviceType: 'BONGSAN',
        subType: '봉안묘',
        rows: [
            { name: '부부 봉안묘 (2위)', price: 0, feeType: 'USAGE', groupType: '부부 봉안묘', note: '2.5평형 이상, 사용기간 무제한, 가격문의' },
            { name: '부부 봉안묘 (4위)', price: 0, feeType: 'USAGE', groupType: '부부 봉안묘', note: '2.5평형 이상, 사용기간 무제한, 가격문의' },
            { name: '가족 봉안묘 (6위)', price: 0, feeType: 'USAGE', groupType: '가족 봉안묘', note: '4평형 이상, 사용기간 무제한, 가격문의' },
            { name: '가족 봉안묘 (9위)', price: 0, feeType: 'USAGE', groupType: '가족 봉안묘', note: '4평형 이상, 사용기간 무제한, 가격문의' },
            { name: '3대 봉안묘 (16위)', price: 0, feeType: 'USAGE', groupType: '3대 봉안묘', note: '4평형 이상, 사용기간 무제한, 가격문의' },
            { name: '문중 봉안묘 (20~50위)', price: 0, feeType: 'USAGE', groupType: '문중 봉안묘', note: '초대형, 사용기간 무제한, 가격문의' },
        ]
    },
    // [1] 매장묘
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        rows: [
            { name: '맞춤형 매장묘', price: 0, feeType: 'USAGE', groupType: '매장묘', note: '주문형, 8평형 이상, 45년, 가격문의' },
            { name: '고급 매장묘 (1인용)', price: 0, feeType: 'USAGE', groupType: '고급 매장묘', note: '4평형 이상, 45년, 가격문의' },
            { name: '고급 매장묘 (2인용)', price: 0, feeType: 'USAGE', groupType: '고급 매장묘', note: '8평형 이상, 45년, 가격문의' },
            { name: '매장묘 (1인용)', price: 0, feeType: 'USAGE', groupType: '매장묘', note: '2.5평형 이상, 45년, 가격문의' },
            { name: '매장묘 (2인용)', price: 0, feeType: 'USAGE', groupType: '매장묘', note: '5평형 이상, 45년, 가격문의' },
            { name: '평장 (최대 2인)', price: 0, feeType: 'USAGE', groupType: '평장', note: '2.5평형 이상, 45년, 가격문의' },
            { name: '소형평장 (최대 2인)', price: 0, feeType: 'USAGE', groupType: '소형평장', note: '1평형, 45년, 가격문의' },
        ]
    },
    // [2] 봉안당 - Coming Soon
    {
        serviceType: 'BONGSAN',
        subType: '봉안당',
        rows: [
            { name: '가격문의', price: 0, feeType: 'USAGE', groupType: '봉안당', note: 'Coming Soon (4개동 추가 계획 중)' },
        ]
    },
];

console.log('✅ 543 실로암 수정:');
p.priceInfo.standardizedPrices.forEach((s, i) => {
    console.log('  [' + i + '] ' + s.subType + ': ' + s.rows.length + '개');
    s.rows.forEach(r => console.log('      ' + r.name + ' → ' + (r.note || '')));
});

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('💾 저장 완료');
