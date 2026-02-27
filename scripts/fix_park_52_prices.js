const fs = require('fs');
const path = require('path');
const filePath = path.join(__dirname, '../data/facilities.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const park = data.find(p => p.id === 'park-0052');
if (!park) { console.error('park-0052 not found'); process.exit(1); }

// Image analysis:
// 시설사용료:
//   매장묘(최장60년) 1구당(26.4㎡) 6,000,000 (상단가격)
//   매장묘(최장60년) 1구당(26.4㎡) 3,000,000 (하단가격)
//   미래형 봉안묘(기간없음) 1기당(33㎡) 10,000,000 / 3,000,000
//   한국형 봉안묘(기간없음) 1기당(33㎡) 10,000,000 / 3,000,000
//   석실 봉안묘(기간없음) 1기당(33㎡) 10,000,000 / 3,000,000
//   봉안담(기간없음) 1위 800,000 / 800,000

park.priceInfo.standardizedPrices = [
    {
        serviceType: 'BURIAL',
        subType: '매장묘',
        feeType: 'USAGE',
        rows: [
            { name: '매장묘 (상단구역)', price: 6000000, groupType: '', note: '1구당 26.4㎡ / 최장 60년' },
            { name: '매장묘 (하단구역)', price: 3000000, groupType: '', note: '1구당 26.4㎡ / 최장 60년' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '봉안묘',
        feeType: 'USAGE',
        rows: [
            { name: '미래형 봉안묘 (상단)', price: 10000000, groupType: '미래형', note: '1기당 33㎡ / 기간없음(영구)' },
            { name: '미래형 봉안묘 (하단)', price: 3000000, groupType: '미래형', note: '1기당 33㎡ / 기간없음(영구)' },
            { name: '한국형 봉안묘 (상단)', price: 10000000, groupType: '한국형', note: '1기당 33㎡ / 기간없음(영구)' },
            { name: '한국형 봉안묘 (하단)', price: 3000000, groupType: '한국형', note: '1기당 33㎡ / 기간없음(영구)' },
            { name: '석실 봉안묘 (상단)', price: 10000000, groupType: '석실형', note: '1기당 33㎡ / 기간없음(영구)' },
            { name: '석실 봉안묘 (하단)', price: 3000000, groupType: '석실형', note: '1기당 33㎡ / 기간없음(영구)' },
        ]
    },
    {
        serviceType: 'BURIAL',
        subType: '봉안담',
        feeType: 'USAGE',
        rows: [
            { name: '봉안담', price: 800000, groupType: '', note: '1위 / 기간없음(영구)' },
        ]
    }
];

fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
console.log('✅ park-0052 칠량자연공원묘원 updated');
