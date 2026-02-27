const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf8'));
for (let i = 71; i <= 80; i++) {
    const id = 'park-00' + i;
    const p = data.find(d => d.id === id);
    if (!p) { console.log(id + ': NOT FOUND'); continue; }
    console.log('=== ' + id + ' ' + p.name + ' ===');
    if (!p.priceInfo || !p.priceInfo.standardizedPrices) { console.log('  NO PRICES'); continue; }
    p.priceInfo.standardizedPrices.forEach((sp, idx) => {
        console.log('  [' + idx + '] sT=' + sp.serviceType + ' sub=' + (sp.subType || '') + ' feeType=' + (sp.feeType || ''));
        if (sp.rows) sp.rows.forEach((r, ri) => {
            console.log('    r' + ri + ': ' + r.name + ' | ' + r.price + ' | g=' + (r.groupType || '') + ' | n=' + (r.note || '') + (r.feeType ? ' | ft=' + r.feeType : '') + (r.residency ? ' | res=' + r.residency : '') + (r.isRepresentative ? ' | REP' : ''));
        });
    });
}
