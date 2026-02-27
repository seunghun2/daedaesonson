const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf8'));
[50, 52, 53, 60].forEach(i => {
    const id = 'park-00' + (i < 10 ? '0' + i : i);
    const p = data.find(d => d.id === id);
    if (!p || !p.priceInfo) return;
    console.log('=== ' + id + ' ' + p.name + ' ===');
    p.priceInfo.standardizedPrices.forEach((sp, si) => {
        sp.rows.forEach((r, ri) => {
            console.log('  [' + si + ']' + sp.subType + ' r' + ri + ': ' + r.name + ' ' + r.price + (r.feeType ? ' ft=' + r.feeType : ''));
        });
    });
});
