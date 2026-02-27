const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf8'));
for (let i = 49; i <= 70; i++) {
    const id = 'park-00' + (i < 10 ? '0' + i : i);
    const p = data.find(d => d.id === id);
    if (!p || !p.priceInfo || !p.priceInfo.standardizedPrices) { console.log(id + ': NO DATA'); continue; }
    const repRows = [];
    p.priceInfo.standardizedPrices.forEach(sp => {
        sp.rows.forEach(r => {
            if (r.isRepresentative) repRows.push(r.name + '=' + r.price);
        });
    });
    // find lowest usage row
    let lowestUsage = null;
    for (const sp of p.priceInfo.standardizedPrices) {
        for (const r of sp.rows) {
            if (!r.feeType || r.feeType === 'USAGE') {
                if (!lowestUsage || r.price < lowestUsage.price) {
                    lowestUsage = { name: r.name, price: r.price, sub: sp.subType };
                }
            }
        }
    }
    if (repRows.length > 0) {
        console.log(id + ' ' + p.name + ' [OK] ' + repRows.join(', '));
    } else {
        const info = lowestUsage ? lowestUsage.sub + '/' + lowestUsage.name + '=' + lowestUsage.price : 'N/A';
        console.log(id + ' ' + p.name + ' [NO REP] lowest=' + info);
    }
}
