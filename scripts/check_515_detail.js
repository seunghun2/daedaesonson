const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
const p = d.find(x => x.id === 'park-0515');
const sp = p.priceInfo?.standardizedPrices;
if (sp) {
    sp.forEach(g => {
        const usage = g.rows.filter(r => r.feeType === 'USAGE').length;
        const maint = g.rows.filter(r => r.feeType === 'MAINTENANCE').length;
        console.log('[' + g.serviceType + '] ' + g.subType + ' -> USAGE:' + usage + ' MAINT:' + maint);
    });
}
