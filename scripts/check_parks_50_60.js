const data = require('../data/facilities.json');
for (let i = 50; i <= 60; i++) {
    const id = 'park-00' + i;
    const p = data.find(d => d.id === id);
    if (!p) { console.log(id + ': NOT FOUND'); continue; }
    console.log('=== ' + id + ' ' + p.name + ' ===');
    if (!p.priceInfo || !p.priceInfo.standardizedPrices) { console.log('  NO PRICES'); continue; }
    p.priceInfo.standardizedPrices.forEach((sp, idx) => {
        console.log('  [' + idx + '] sT=' + sp.serviceType + ' sub=' + (sp.subType || '') + ' fee=' + sp.feeType);
        if (sp.rows) sp.rows.forEach((r, ri) => {
            console.log('    r' + ri + ': ' + r.name + ' | ' + r.price + ' | g=' + (r.groupType || '') + ' | n=' + (r.note || ''));
        });
    });
}
