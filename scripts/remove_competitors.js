const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facility_urls_cleaned.json'), 'utf-8'));

// 경쟁사/중개사이트 도메인 - 삭제 대상
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

let removed = 0;

data.forEach(d => {
    if (!d.url) return;
    const url = d.url.toLowerCase();
    const isCompetitor = competitors.some(comp => url.includes(comp));
    if (isCompetitor) {
        console.log(d.no + '. ' + d.name + ' -> 삭제');
        d.url = null;
        d.urlRemoved = true;
        d.removeReason = 'competitor';
        removed++;
    }
});

// 저장
fs.writeFileSync(
    path.join(__dirname, '../data/facility_urls_cleaned.json'),
    JSON.stringify(data, null, 2)
);

const withUrl = data.filter(d => d.url).length;
const withoutUrl = data.filter(d => !d.url).length;

console.log('');
console.log('✅ 경쟁사 URL 삭제 완료!');
console.log('   삭제됨: ' + removed + '개');
console.log('   URL 있음: ' + withUrl + '개');
console.log('   URL 없음: ' + withoutUrl + '개');
