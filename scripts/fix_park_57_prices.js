const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0057');
if (!park) { console.error('park-0057 not found'); process.exit(1); }

// Image analysis:
// 단장-추모공원 평장 사용료(관내) 270,000 / 관리비(관내) 100,000
// 단장-추모공원 평장 사용료(관외) 1,250,000 / 관리비(관외) 300,000
// 합장-추모공원 평장 사용료(관내+관내) 420,000 / 관리비(관내+관내) 200,000
// 합장-추모공원 평장 사용료(관외+관외) 2,000,000 / 관리비(관외+관외) 600,000
// 합장-추모공원 평장 사용료(관내+관외) 1,400,000 / 관리비(관내+관외) 400,000
// All: 1기당, 최초 15년

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '평장묘',
        feeType: 'USAGE',
        rows: [
            { name: '사용료 (단장, 관내)', price: 270000, groupType: '단장', note: '1기당 / 최초 15년' },
            { name: '관리비 (단장, 관내)', price: 100000, groupType: '단장', note: '1기당 / 최초 15년' },
            { name: '사용료 (단장, 관외)', price: 1250000, groupType: '단장', note: '1기당 / 최초 15년' },
            { name: '관리비 (단장, 관외)', price: 300000, groupType: '단장', note: '1기당 / 최초 15년' },
            { name: '사용료 (합장, 관내+관내)', price: 420000, groupType: '합장', note: '1기당 / 최초 15년' },
            { name: '관리비 (합장, 관내+관내)', price: 200000, groupType: '합장', note: '1기당 / 최초 15년' },
            { name: '사용료 (합장, 관내+관외)', price: 1400000, groupType: '합장', note: '1기당 / 최초 15년' },
            { name: '관리비 (합장, 관내+관외)', price: 400000, groupType: '합장', note: '1기당 / 최초 15년' },
            { name: '사용료 (합장, 관외+관외)', price: 2000000, groupType: '합장', note: '1기당 / 최초 15년' },
            { name: '관리비 (합장, 관외+관외)', price: 600000, groupType: '합장', note: '1기당 / 최초 15년' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0057 함안군공설추모공원 updated');
