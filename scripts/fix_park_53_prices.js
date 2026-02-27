const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0053');
if (!park) { console.error('park-0053 not found'); process.exit(1); }

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'USAGE',
        rows: [
            { name: '묘지 사용료 (1평)', price: 840400, groupType: '', note: '평당 기준' },
            { name: '용역비 (매장 작업비)', price: 1194000, groupType: '', note: '직원 인건비 포함' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'MAINTENANCE',
        rows: [
            { name: '연간 관리비 (1평)', price: 15200, groupType: '', note: '평당 / 부가세 별도' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '[필수]석물',
        feeType: 'STONE',
        rows: [
            { name: '상석', price: 705000, groupType: '석물', note: '800×500×140mm / 국산 황등석' },
            { name: '오석 (비석)', price: 926000, groupType: '석물', note: '국산' },
            { name: '둘레석', price: 1145000, groupType: '석물', note: '1400×180×100mm / 국산 황등석' },
            { name: '석관', price: 143000, groupType: '석물', note: '국산' },
            { name: '좌대', price: 321000, groupType: '석물', note: '900×250×200mm / 국산 황등석' },
            { name: '잔디', price: 100000, groupType: '장례용품', note: '국산' },
            { name: '꽃병', price: 66000, groupType: '장례용품', note: '국산' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0053 fixed: [필수]석물 + 관리비→MAINTENANCE');
