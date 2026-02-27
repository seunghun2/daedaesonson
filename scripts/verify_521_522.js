const d = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));

// 521 검증
console.log('=== 521 용인추모원 ===');
const p521 = d.find(x => x.id === 'park-0521');
p521.priceInfo.standardizedPrices.forEach(g => {
    console.log('\n' + g.subType + ':');
    const byGroup = {};
    g.rows.forEach(r => {
        const gt = r.groupType || '(공통)';
        if (!byGroup[gt]) byGroup[gt] = [];
        byGroup[gt].push(r);
    });
    Object.entries(byGroup).forEach(([gt, rows]) => {
        console.log('  [' + gt + '] ' + rows.map(r => r.name + '=' + (r.price / 10000) + '만').join(', '));
    });
});

// 522 검증
console.log('\n\n=== 522 연천동막골추모관 ===');
const p522 = d.find(x => x.id === 'park-0522');
p522.priceInfo.standardizedPrices.forEach(g => {
    console.log('\n' + g.subType + ' (' + g.rows.length + '건):');
    const byGroup = {};
    g.rows.forEach(r => {
        const gt = r.groupType || '(공통)';
        if (!byGroup[gt]) byGroup[gt] = [];
        byGroup[gt].push(r);
    });
    Object.entries(byGroup).forEach(([gt, rows]) => {
        console.log('  [' + gt + '] ' + rows.map(r => r.name + '=' + (r.price / 10000) + '만').join(', '));
    });
});
