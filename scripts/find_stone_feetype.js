const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
const issues = [];
d.forEach(p => {
    const sp = p.priceInfo?.standardizedPrices;
    if (!sp) return;
    sp.forEach(g => {
        g.rows?.forEach(r => {
            if (r.feeType === 'STONE') {
                issues.push(p.id + ' ' + p.name + ' | [' + g.serviceType + '] ' + g.subType + ' | ' + r.name + ' = ' + r.price);
            }
        });
    });
});
console.log('feeType=STONE 남은 항목: ' + issues.length + '개');
issues.forEach(i => console.log('  ' + i));
