const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/pricing_class_final.json', 'utf8'));

// 1. Find suspicious keyword items
const keywords = ['총매장능력', '개편의시설', '안치능력', '총안치', '주차가능', '부지면적'];
const badItems = data.filter(d => {
    const text = (d.itemName2 || '') + (d.rawText || '');
    return keywords.some(k => text.includes(k));
});

console.log('--- 의심 데이터 발견 ---');
console.log('총 개수:', badItems.length);
if (badItems.length > 0) {
    console.log('샘플 5개:', badItems.slice(0, 5).map(d => `[${d.id || d.parkId}] ${d.itemName2} (${d.price}원)`));
}

// 2. Find IDs that ONLY have these bad items (no real price)
const idCounts = {}; // { '123': { total: 10, bad: 10 } }

data.forEach(d => {
    const id = String(d.parkId || d.id);
    if (!idCounts[id]) idCounts[id] = { total: 0, bad: 0 };

    idCounts[id].total++;

    const text = (d.itemName2 || '') + (d.rawText || '');
    if (keywords.some(k => text.includes(k))) {
        idCounts[id].bad++;
    }
});

const purelyBadIds = Object.keys(idCounts).filter(id => idCounts[id].total > 0 && idCounts[id].total === idCounts[id].bad);

console.log('--- 정상 데이터 없이 \'엉뚱한 정보\'만 있는 ID 목록 ---');
console.log(purelyBadIds);
