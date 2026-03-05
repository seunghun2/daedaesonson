const d = require('../data/facilities.json');
for (let i = 776; i <= 785; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const p = d.find(x => x.id === id);
    if (!p) { console.log(id, 'NOT FOUND'); continue; }
    const sp = p.priceInfo?.standardizedPrices || [];
    const rows = sp.flatMap(g => g.rows || []);
    console.log('\n' + '='.repeat(50));
    console.log(id, p.name, '|', p.category, '| operatorType:', p.operatorType || '');
    rows.forEach(r => {
        const star = r.isRepresentative ? '★' : '';
        console.log('  ', r.name, '=', r.price?.toLocaleString() || '문의', '|', r.feeType || 'USAGE', '| grade:', r.grade || '', '| res:', r.residency || '', star);
    });
}
