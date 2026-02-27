const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
const p = d.find(x => x.id === 'park-0521');
console.log('=== 521 ' + p.name + ' ===\n');
p.priceInfo.standardizedPrices.forEach(g => {
    console.log('[' + g.serviceType + '] ' + g.subType);
    const byGroup = {};
    g.rows.forEach((r, i) => {
        const gt = r.groupType || '미분류';
        if (!byGroup[gt]) byGroup[gt] = [];
        byGroup[gt].push({ ...r, _idx: i });
    });
    Object.entries(byGroup).forEach(([gt, rows]) => {
        console.log('  --- ' + gt + ' (' + rows.length + '건) ---');
        rows.forEach(r => {
            let line = '    ' + r.name + ' = ' + r.price.toLocaleString();
            if (r.grade) line += ' | grade: ' + r.grade;
            if (r.feeType) line += ' | fee: ' + r.feeType;
            if (r.isRepresentative) line += ' | *';
            console.log(line);
        });
    });
    console.log('');
});
