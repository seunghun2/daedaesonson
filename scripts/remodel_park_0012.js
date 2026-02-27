const fs = require('fs');

const path = './data/facilities.json';
const data = JSON.parse(fs.readFileSync(path, 'utf8'));

const parkIndex = data.findIndex(p => p.id === 'park-0012');

if (parkIndex === -1) {
    console.error('park-0012 not found');
    process.exit(1);
}

const park = data[parkIndex];

park.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘 (단장 / 6평형)',
        rows: [
            { name: '묘지사용료 (6평형)', price: 5270000, feeType: 'USAGE', isRepresentative: true },
            { name: '묘지관리비 (6평형)', price: 1730000, feeType: 'MAINTENANCE', note: '19.8㎡' },
            { name: '분묘설치비 (매장비)', price: 450000, feeType: 'USAGE', note: '1기' }
        ]
    },
    {
        serviceType: 'OTHER',
        subType: '선택항목 (단장묘 석물)',
        rows: [
            { name: '석물단장묘(6평형) 석물', price: 9000000, feeType: 'OPTIONAL', note: '1200x2050x1070' },
            { name: '봉분단장묘(3평형) 석물', price: 5500000, feeType: 'OPTIONAL', note: '1200x2200x550' }
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '매장묘 (합장 / 9평형)',
        rows: [
            { name: '묘지사용료 (9평형)', price: 7900000, feeType: 'USAGE', isRepresentative: false },
            { name: '묘지관리비 (9평형)', price: 2600000, feeType: 'MAINTENANCE', note: '29.7㎡' },
            { name: '분묘설치비 (매장비)', price: 750000, feeType: 'USAGE', note: '1기' }
        ]
    },
    {
        serviceType: 'OTHER',
        subType: '선택항목 (합장묘 석물)',
        rows: [
            { name: '석물합장묘(9평형) 석물', price: 12400000, feeType: 'OPTIONAL', note: '1550x2200x1140' },
            { name: '봉분합장묘(9평형) 석물', price: 7700000, feeType: 'OPTIONAL', note: '1600x2200x550' }
        ]
    },
    {
        serviceType: 'CEMETERY',
        subType: '봉안묘 (6기 / 3평형)',
        rows: [
            { name: '봉안묘사용료 (6기)', price: 2630000, feeType: 'USAGE', isRepresentative: true, note: '9.9㎡' },
            { name: '봉안묘관리비 (6기)', price: 860000, feeType: 'MAINTENANCE' },
            { name: '봉안비 (최초 봉안)', price: 220000, feeType: 'MAINTENANCE' },
            { name: '석물 (6기/3평형)', price: 4800000, feeType: 'OPTIONAL', note: '900x900x980' }
        ]
    },
    {
        serviceType: 'CEMETERY',
        subType: '봉안묘 (12기 / 4.5평형)',
        rows: [
            { name: '봉안묘사용료 (12기)', price: 3950000, feeType: 'USAGE', isRepresentative: false, note: '14.8㎡' },
            { name: '봉안묘관리비 (12기)', price: 1300000, feeType: 'MAINTENANCE' },
            { name: '봉안비 (안치작업비)', price: 250000, feeType: 'MAINTENANCE' },
            { name: '석물 (12기/4.5평형)', price: 7200000, feeType: 'OPTIONAL', note: '1200x1300x1055' }
        ]
    },
    {
        serviceType: 'CEMETERY',
        subType: '봉안묘 (24기 / 6평형)',
        rows: [
            { name: '봉안묘사용료 (24기)', price: 5270000, feeType: 'USAGE', isRepresentative: false, note: '19.8㎡' },
            { name: '봉안묘관리비 (24기)', price: 1730000, feeType: 'MAINTENANCE' },
            { name: '봉안비 (안치작업비)', price: 250000, feeType: 'MAINTENANCE' },
            { name: '석물 (24기/6평형)', price: 11200000, feeType: 'OPTIONAL', note: '1200x2020x1055' }
        ]
    },
    {
        serviceType: 'CEMETERY',
        subType: '봉안묘 (36기 / 9평형)',
        rows: [
            { name: '봉안묘사용료 (36기)', price: 7900000, feeType: 'USAGE', isRepresentative: false, note: '29.7㎡' },
            { name: '봉안묘관리비 (36기)', price: 2600000, feeType: 'MAINTENANCE' },
            { name: '봉안비 (안치작업비)', price: 250000, feeType: 'MAINTENANCE' },
            { name: '석물 (36기/9평형)', price: 14600000, feeType: 'OPTIONAL', note: '1600x2130x1125' }
        ]
    },
    {
        serviceType: 'CEMETERY',
        subType: '봉안묘 (60기 / 15평형)',
        rows: [
            { name: '봉안묘사용료 (60기)', price: 13180000, feeType: 'USAGE', isRepresentative: false, note: '49.5㎡' },
            { name: '봉안묘관리비 (60기)', price: 4340000, feeType: 'MAINTENANCE' },
            { name: '봉안비 (안치작업비)', price: 250000, feeType: 'MAINTENANCE' },
            { name: '석물 (60기/15평형)', price: 21600000, feeType: 'OPTIONAL', note: '2400x2000x1300' }
        ]
    },
    {
        serviceType: 'OTHER',
        subType: '서비스 항목',
        rows: [
            { name: '천막/상/돗자리 제공', price: 0, feeType: 'OPTIONAL', note: '행사당일 및 삼우제 무료 지원' }
        ]
    }
];

fs.writeFileSync(path, JSON.stringify(data, null, 2), 'utf8');
console.log('park-0012 has been successfully remodeled!');
