const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facility_urls_cleaned.json'), 'utf-8'));

// 경쟁사/중개사이트 도메인
const competitors = [
    'goifuneral',
    'myungdangga',
    'funeralblog',
    'funeraloner',
    'rightfuneral',
    'placeview',
    'linktoplace',
    'saeob.com',
    'bugosms',
    'ciff.kr',
    'endingsketch',
    'cheotjang',
    'metropolitan-funeral',
    'honam-funeralcenter',
    'hospitalk',
    'ch-funeralportal',
    'gangwon-portal',
    '15774129.go.kr'
];

const found = {};
data.forEach(d => {
    if (!d.url) return;
    const url = d.url.toLowerCase();
    competitors.forEach(comp => {
        if (url.includes(comp)) {
            found[comp] = (found[comp] || 0) + 1;
        }
    });
});

console.log('🔍 경쟁사/중개사이트 URL 현황:');
console.log('================================');
Object.entries(found)
    .sort((a, b) => b[1] - a[1])
    .forEach(([domain, count]) => {
        console.log('  ⚠️ ' + domain + ': ' + count + '개');
    });

const total = Object.values(found).reduce((a, b) => a + b, 0);
console.log('');
console.log('총 ' + total + '개 경쟁사 URL 남아있음');
