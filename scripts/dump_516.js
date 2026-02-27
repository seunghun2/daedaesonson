const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
const p = d.find(x => x.id === 'park-0516');
console.log('=== 516 ' + p.name + ' ===');
p.priceInfo.standardizedPrices.forEach(g => {
    console.log('\n[' + g.serviceType + '] ' + g.subType);
    const byGroup = {};
    g.rows.forEach((r, idx) => {
        const gt = r.groupType || '미분류';
        if (!byGroup[gt]) byGroup[gt] = [];
        byGroup[gt].push({ ...r, _idx: idx });
    });
    Object.entries(byGroup).forEach(([gt, rows]) => {
        console.log('  --- ' + gt + ' (' + rows.length + '건) ---');
        rows.forEach(r => {
            let line = '    [' + r._idx + '] ' + r.name + ' = ' + r.price;
            if (r.grade) line += ' | grade: ' + r.grade;
            if (r.feeType) line += ' | fee: ' + r.feeType;
            if (r.isRepresentative) line += ' | *';
            console.log(line);
        });
    });
});
