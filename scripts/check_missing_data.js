const fs = require('fs');

const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

const noAddr = data.filter(f => !f.address || f.address.trim() === '');
const noUpdate = data.filter(f => !f.lastUpdated || f.lastUpdated === 'YYYY-MM-DD' || f.lastUpdated.trim() === '');
const both = data.filter(f =>
    (!f.address || f.address.trim() === '') ||
    (!f.lastUpdated || f.lastUpdated === 'YYYY-MM-DD' || f.lastUpdated.trim() === '')
);

console.log('주소 없음:', noAddr.length);
console.log('업데이트 날짜 없음:', noUpdate.length);
console.log('주소 OR 업데이트 없음 (처리 대상):', both.length);

// 처음 5개 예시
console.log('\n예시 (처음 5개):');
both.slice(0, 5).forEach(f => {
    console.log(`  ${f.id} | 주소: ${f.address || '없음'} | 업데이트: ${f.lastUpdated || '없음'}`);
});
