const d = require('../data/facilities.json');
for (let i = 846; i <= 855; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const p = d.find(x => x.id === id);
    if (!p) { console.log(id, 'NOT FOUND'); continue; }
    const sp = p.priceInfo?.standardizedPrices || [];
    const rows = sp.flatMap(g => (g.rows || []).map(r => ({ ...r, serviceType: g.serviceType, subType: g.subType })));
    console.log('\n' + '='.repeat(60));
    console.log(id, p.name, '|', p.category, '| op:', p.operatorType || '');
    rows.forEach(r => {
        const star = r.isRepresentative ? '★' : '';
        console.log('  [' + r.serviceType + ']', r.subType, '→', r.name, '=', r.price?.toLocaleString() || '문의', '|', r.feeType || 'USAGE', '| grade:', r.grade || '', '| res:', r.residency || '', star);
    });
}
