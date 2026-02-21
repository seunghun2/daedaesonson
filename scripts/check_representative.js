const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
const facilities = data.facilities || data;

let total = 0, withPriceTable = 0, withRep = 0, withoutRep = 0;
const noRepList = [];
const repSummary = [];

facilities.forEach(f => {
    total++;
    const pt = f.priceInfo?.priceTable || f.pricing;
    if (!pt) return;
    withPriceTable++;

    let hasRep = false;
    const repItems = [];

    for (const cat of Object.keys(pt)) {
        if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(cat)) continue;
        const rows = pt[cat]?.rows || [];
        const rep = rows.find(r => r.isRepresentative);
        if (rep) {
            hasRep = true;
            repItems.push(`${cat}: ${rep.name} ${rep.price}만원`);
        }
    }

    if (hasRep) {
        withRep++;
        repSummary.push({ id: f.id, name: f.name, reps: repItems });
    } else {
        withoutRep++;
        // 카테고리와 최저가 표시
        const cats = [];
        for (const cat of Object.keys(pt)) {
            if (/옵션|관리비|기타|공통|제외|석물|비고|안내|별도/.test(cat)) continue;
            const rows = pt[cat]?.rows || [];
            const prices = rows.map(r => r.price).filter(p => p > 0);
            const min = prices.length > 0 ? Math.min(...prices) : 0;
            cats.push(`${cat}(${rows.length}항목, 최저 ${min}만원)`);
        }
        noRepList.push({ id: f.id, name: f.name, cats });
    }
});

console.log('=== 대표가격 현황 ===');
console.log(`총 시설: ${total}`);
console.log(`priceTable 보유: ${withPriceTable}`);
console.log(`★ 대표가격 있음: ${withRep}`);
console.log(`★ 없음 (설정 필요): ${withoutRep}`);
console.log('');

console.log('=== ★ 이미 설정된 시설 ===');
repSummary.forEach(s => {
    console.log(`  ${s.id} | ${s.name}`);
    s.reps.forEach(r => console.log(`    ★ ${r}`));
});

console.log('');
console.log('=== ★ 없는 시설 (설정 필요) ===');
noRepList.forEach(s => {
    console.log(`  ${s.id} | ${s.name}`);
    s.cats.forEach(c => console.log(`    - ${c}`));
});
