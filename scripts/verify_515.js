const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
const p = d.find(x => x.id === 'park-0515');
p.priceInfo.standardizedPrices.forEach(g => {
    console.log('\n[' + g.serviceType + '] ' + g.subType);
    const byGroup = {};
    g.rows.forEach(r => {
        const gt = r.groupType || '(공통)';
        if (!byGroup[gt]) byGroup[gt] = [];
        byGroup[gt].push(r);
    });
    Object.entries(byGroup).forEach(([gt, rows]) => {
        console.log('  --- ' + gt + ' (' + rows.length + '건) ---');
        rows.forEach(r => {
            let line = '    ' + r.name + ' = ' + r.price;
            if (r.feeType) line += ' | fee: ' + r.feeType;
            if (r.isRepresentative) line += ' | *';
            console.log(line);
        });
    });
});
