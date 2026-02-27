const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0051');
if (!park) { console.error('park-0051 not found'); process.exit(1); }

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'USAGE',
        rows: [
            { name: '묘지 사용료 (하단구역)', price: 20000000, groupType: '', note: '5㎡ / 30년간 사용' },
            { name: '묘지 사용료 (상단구역)', price: 15000000, groupType: '', note: '5㎡ / 30년간 사용' },
            { name: '부부합장묘 추가비용', price: 1500000, groupType: '', note: '' },
            { name: '자연장', price: 1500000, groupType: '', note: '30cm×30cm / 표석없음 / 관리비없음 / 기간 영구' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'MAINTENANCE',
        rows: [
            { name: '관리비 (10년 선납)', price: 600000, groupType: '', note: '1년 60,000원 × 10년' },
        ]
    },
    {
        serviceType: 'BONGSAN',
        subType: '봉안당',
        feeType: 'USAGE',
        rows: [
            { name: '봉안당 (개인함/부부함)', price: 0, groupType: '', note: '호실과 단의 높이에 따라 정함' },
        ]
    },
    {
        serviceType: 'BONGSAN',
        subType: '봉안당',
        feeType: 'MAINTENANCE',
        rows: [
            { name: '관리비 (10년 선납)', price: 500000, groupType: '', note: '1년 50,000원 × 10년' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0051 fixed: 관리비→MAINTENANCE');
