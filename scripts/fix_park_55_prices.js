const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0055');
if (!park) { console.error('park-0055 not found'); process.exit(1); }

// Image analysis - 공설묘지 동해시민 vs 관외:
// 단장:
//   사용료(관내) 660,000 / 관리비(관내) 240,000 / 석물비(관내) 938,000
//   매장비(단장,하절기)(관내) 360,000 / 매장비(단장,동절기)(관내) 400,000
// 합장:
//   사용료(관내) 960,000 / 관리비(관내) 360,000 / 석물비(관내) 1,060,000
//   매장비(합장,하절기)(관내) 360,000 / 매장비(합장,동절기)(관내) 400,000
// NOTE: CSV only has 관내 data, so image only shows 관내 pricing
// Period: 15년

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'USAGE',
        rows: [
            { name: '사용료 (단장)', price: 660000, groupType: '단장 (관내)', note: '동해시민 / 15년' },
            { name: '관리비 (단장)', price: 240000, groupType: '단장 (관내)', note: '동해시민 / 15년' },
            { name: '석물비 (단장)', price: 938000, groupType: '단장 (관내)', note: '동해시민 / 15년' },
            { name: '매장비 (단장, 하절기)', price: 360000, groupType: '단장 (관내)', note: '동해시민 / 15년' },
            { name: '매장비 (단장, 동절기)', price: 400000, groupType: '단장 (관내)', note: '동해시민 / 15년' },
            { name: '사용료 (합장)', price: 960000, groupType: '합장 (관내)', note: '동해시민 / 15년' },
            { name: '관리비 (합장)', price: 360000, groupType: '합장 (관내)', note: '동해시민 / 15년' },
            { name: '석물비 (합장)', price: 1060000, groupType: '합장 (관내)', note: '동해시민 / 15년' },
            { name: '매장비 (합장, 하절기)', price: 360000, groupType: '합장 (관내)', note: '동해시민 / 15년' },
            { name: '매장비 (합장, 동절기)', price: 400000, groupType: '합장 (관내)', note: '동해시민 / 15년' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0055 동해시하늘정원묘지 updated');
