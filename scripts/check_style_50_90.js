const data = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
for (let i = 50; i <= 90; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const p = data.find(d => d.id === id);
    if (!p) continue;
    const sp = p.priceInfo?.standardizedPrices;
    if (!sp || sp.length === 0) continue;
    console.log(`\n=== ${id} ${p.name} ===`);
    sp.forEach((g) => {
        console.log(`  [${g.serviceType}] ${g.subType}`);
        g.rows.forEach((r) => {
            console.log(`    name: "${r.name}"`);
            console.log(`    price: ${r.price}`);
            if (r.grade) console.log(`    grade: "${r.grade}"`);
            if (r.note) console.log(`    note: "${r.note}"`);
            if (r.feeType) console.log(`    feeType: ${r.feeType}`);
            if (r.isRepresentative) console.log(`    ★ 대표가격`);
            console.log('    ---');
        });
    });
}
