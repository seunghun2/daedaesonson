const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0059');
if (!park) { console.error('park-0059 not found'); process.exit(1); }

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        rows: [
            { name: '묘지사용료 (3.3㎡)', price: 1577000, groupType: '', note: '1평 기준' },
            { name: '관리비 (3.3㎡)', price: 18400, groupType: '', note: '1평 기준', feeType: 'MAINTENANCE' },
            { name: '매장 작업비', price: 1900000, groupType: '', note: '구당' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '[필수]석물 Set',
        rows: [
            { name: '1단 합장 외 3종', price: 2920000, groupType: '', note: '1단묘테, 비석, 상석, 화병 포함' },
            { name: '3단 합장 외 3종 (소)', price: 4320000, groupType: '', note: '3단묘테, 비석, 상석, 화병 포함' },
            { name: '3단 합장 외 3종 (신)', price: 5240000, groupType: '', note: '3단묘테, 비석, 상석, 화병 포함' },
            { name: '3단 합장 외 3종 (본)', price: 6030000, groupType: '', note: '3단묘테, 비석, 상석, 화병 포함' },
            { name: '3단 합장 외 3종 (특)', price: 6280000, groupType: '', note: '3단묘테, 비석, 상석, 화병 포함' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0059 fixed: 석물 Set → [필수]석물 Set 별도 아코디언');
