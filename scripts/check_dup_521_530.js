const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
for (let i = 521; i <= 530; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const p = d.find(x => x.id === id);
    if (!p) continue;
    const sp = p.priceInfo?.standardizedPrices;
    if (!sp) continue;
    let hasDup = false;
    sp.forEach(g => {
        const seen = {};
        g.rows.forEach(r => {
            const key = (r.groupType || '') + '|' + r.name + '|' + (r.grade || '');
            if (!seen[key]) seen[key] = [];
            seen[key].push(r.price);
        });
        Object.entries(seen).forEach(([k, prices]) => {
            if (prices.length > 1) {
                if (!hasDup) { console.log('\n=== ' + id + ' ' + p.name + ' ==='); hasDup = true; }
                console.log('  중복: [' + g.subType + '] ' + k + ' → ' + prices.join(', '));
            }
        });
    });
}
console.log('\n--- 완료 ---');
