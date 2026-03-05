const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facilities.json'), 'utf8'));
for (let i = 896; i <= 905; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const f = data.find(d => d.id === id);
    if (!f) { console.log(`\n${'='.repeat(60)}\n${id} NOT FOUND`); continue; }
    console.log(`\n${'='.repeat(60)}\n${id} ${f.name} | ${f.category2} | op: ${f.operatorType}`);
    const sp = f.priceInfo?.standardizedPrices || [];
    if (!sp.length) { console.log('  (데이터 없음)'); continue; }
    for (const g of sp) {
        for (const r of (g.rows || [])) {
            const rep = r.isRepresentative ? ' ★' : '';
            console.log(`  [${g.serviceType}] ${g.subType} → ${r.name} = ${(r.price || 0).toLocaleString()} | ${r.feeType || '?'} | grade: ${r.grade || ''} | res: ${r.residency || ''} ${rep}`);
        }
    }
}
