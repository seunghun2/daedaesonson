// 재검증에서 추가된 63개 리스트 확인
const fs = require('fs');
const verified = JSON.parse(fs.readFileSync('data/facility-websites-verified.json', 'utf-8'));
const facs = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));

const unmatchedIds = new Set(verified.unmatched.map(u => u.id));
const verifiedIds = new Set(verified.verified.map(v => v.id));

const list = [];
facs.forEach(f => {
    if (f.websiteUrl && unmatchedIds.has(f.id) && !verifiedIds.has(f.id)) {
        list.push({ id: f.id, name: f.name, url: f.websiteUrl });
    }
});
list.sort((a, b) => a.id.localeCompare(b.id));
list.forEach((l, i) => console.log(`${i + 1}. ${l.id} | ${l.name} | ${l.url}`));
console.log('\n총:', list.length);
