const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
for (let i = 321; i <= 330; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const p = d.find(x => x.id === id);
    if (!p) { console.log('=== ' + id + ' NOT FOUND ==='); continue; }
    console.log('=== ' + id + ' ' + p.name + ' ===');
    const sp = p.priceInfo?.standardizedPrices;
    if (!sp || sp.length === 0) { console.log('  (가격 데이터 없음)'); continue; }
    sp.forEach(g => {
        console.log('  [' + g.serviceType + '] ' + g.subType);
        g.rows.forEach(r => {
            let line = '    ' + r.name + ' = ' + r.price;
            if (r.grade) line += ' | grade: ' + r.grade;
            if (r.feeType) line += ' | fee: ' + r.feeType;
            if (r.residency) line += ' | res: ' + r.residency;
            if (r.isRepresentative) line += ' | *';
            if (r.groupType) line += ' | group: ' + r.groupType;
            console.log(line);
        });
    });
}
