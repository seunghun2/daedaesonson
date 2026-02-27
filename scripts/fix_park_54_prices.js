const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0054');
if (!park) { console.error('park-0054 not found'); process.exit(1); }

// Fix: 관리비 항목들을 feeType MAINTENANCE로 분리
park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'USAGE',
        rows: [
            { name: '묘지사용료 (3.3㎡/1년)', price: 1600000, groupType: '기본비용', note: '1평 기준 / 1년' },
            { name: '고급실 부부 (평균가)', price: 15210000, groupType: '고급실', note: '석물 포함 평균가' },
            { name: '고급실 개인 (평균가)', price: 7280000, groupType: '고급실', note: '석물 포함 평균가' },
            { name: '일반실 부부 (평균가)', price: 9510000, groupType: '일반실', note: '석물 포함 평균가' },
            { name: '일반실 개인 (평균가)', price: 4940000, groupType: '일반실', note: '석물 포함 평균가' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'MAINTENANCE',
        rows: [
            { name: '연간 관리비 (3.3㎡)', price: 17000, groupType: '기본비용', note: '1평 기준 / 1년' },
            { name: '고급실 부부 관리비', price: 92000, groupType: '고급실', note: '1년 기준' },
            { name: '고급실 개인 관리비', price: 51000, groupType: '고급실', note: '1년 기준' },
            { name: '일반실 부부 관리비', price: 82000, groupType: '일반실', note: '1년 기준' },
            { name: '일반실 개인 관리비', price: 41000, groupType: '일반실', note: '1년 기준' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0054 fixed: 관리비 → MAINTENANCE로 분리');
