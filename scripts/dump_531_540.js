const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facilities.json'), 'utf8'));

for (let i = 531; i <= 540; i++) {
    const id = 'park-0' + i;
    const p = data.find(x => x.id === id);
    if (!p) continue;
    console.log('\n=== ' + id + ' ' + p.name + ' ===');
    const sp = p.priceInfo?.standardizedPrices || [];
    sp.forEach((acc, ai) => {
        console.log('  [' + ai + '] ' + acc.serviceType + ' / ' + acc.subType);
        (acc.rows || []).forEach((r, ri) => {
            const g = r.groupType ? ' [' + r.groupType + ']' : '';
            const res = r.residency ? ' {' + r.residency + '}' : '';
            const rep = r.isRepresentative ? ' ★' : '';
            const grade = r.grade ? ' <' + r.grade + '>' : '';
            console.log('    ' + ri + ') ' + r.name + ' = ' + (r.price?.toLocaleString() || '?') + ' (' + r.feeType + ')' + g + res + rep + grade);
        });
    });
}
