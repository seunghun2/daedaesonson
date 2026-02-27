const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0060');
if (!park) { console.error('park-0060 not found'); process.exit(1); }

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        rows: [
            { name: '묘지대 (3.3㎡)', price: 1300000, groupType: '', note: '1평당' },
            { name: '묘지관리비 (3.3㎡/년)', price: 14000, groupType: '', note: '1평당 / 1년', feeType: 'MAINTENANCE' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '석물',
        rows: [
            { name: '애석 (비석)', price: 900000, groupType: '', note: '66cm (2.2척)' },
            { name: '오석 (비석)', price: 700000, groupType: '', note: '75cm (2.5척)' },
        ]
    },
    {
        serviceType: 'BONGSAN',
        subType: '납골',
        rows: [
            { name: '유연납골 (10년간)', price: 280000, groupType: '유연납골', note: '10년 기준' },
            { name: '유연납골 관리비 (1기)', price: 50000, groupType: '유연납골', note: '1기당 / 1년', feeType: 'MAINTENANCE' },
            { name: '무연납골 (10년간)', price: 50000, groupType: '무연납골', note: '10년 기준' },
            { name: '무연납골 관리비 (1기)', price: 25000, groupType: '무연납골', note: '1기당 / 1년', feeType: 'MAINTENANCE' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0060 fixed: 석물 별도 아코디언');
