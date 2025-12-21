const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facility_urls.json'), 'utf-8'));

// CSV 생성
let csv = '번호,시설명,URL\n';
data.forEach(d => {
    const name = (d.name || '').replace(/,/g, ' ');
    const url = d.url || '(없음)';
    csv += `${d.no},${name},${url}\n`;
});

fs.writeFileSync(path.join(__dirname, '../data/facility_urls.csv'), csv, 'utf-8');
console.log('✅ CSV 저장: data/facility_urls.csv');
console.log('총 ' + data.length + '개');
console.log('URL 있음: ' + data.filter(d => d.url).length);
console.log('URL 없음: ' + data.filter(d => !d.url).length);

// URL 없는 시설 출력
const noUrl = data.filter(d => !d.url);
if (noUrl.length > 0) {
    console.log('\n⚠️ URL 없는 시설:');
    noUrl.forEach(d => console.log('  - ' + d.no + ': ' + d.name));
}

// 샘플 출력
console.log('\n📋 샘플 (처음 10개):');
data.slice(0, 10).forEach(d => {
    console.log(`  ${d.no}. ${d.name} → ${d.url || '없음'}`);
});
