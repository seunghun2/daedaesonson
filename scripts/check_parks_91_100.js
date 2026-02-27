const data = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
for (let i = 91; i <= 100; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const p = data.find(d => d.id === id);
    if (!p) { console.log('=== ' + id + ' NOT FOUND ==='); continue; }
    console.log('=== ' + id + ' ' + p.name + ' (' + (p.operatorType || '?') + ') ===');
    const sp = p.priceInfo?.standardizedPrices;
    if (!sp || sp.length === 0) { console.log('  ❌ standardizedPrices 없음'); continue; }
    sp.forEach((g, gi) => {
        console.log('  [' + gi + '] svc=' + g.serviceType + ' sub=' + g.subType);
        g.rows.forEach((r, ri) => {
            let info = '    r' + ri + ': ' + r.name + ' | ' + r.price;
            if (r.feeType && r.feeType !== 'USAGE') info += ' | ft=' + r.feeType;
            if (r.residency) info += ' | res=' + r.residency;
            if (r.isRepresentative) info += ' | ★';
            if (r.groupType) info += ' | grp=' + r.groupType;
            if (r.grade) info += ' | grade=' + r.grade;
            if (r.note) info += ' | note=' + r.note;
            console.log(info);
        });
    });
}
