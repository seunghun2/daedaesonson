const fs = require('fs');
const data = JSON.parse(fs.readFileSync(require('path').join(__dirname, '../data/facilities.json'), 'utf8'));
['park-0621', 'park-0622'].forEach(id => {
    const p = data.find(x => x.id === id);
    if (!p) { console.log(id, 'NOT FOUND'); return; }
    console.log('=== ' + id + ' | ' + p.name + ' ===');
    console.log('주소:', p.address);
    console.log('websiteUrl:', p.websiteUrl || '없음');
    const sp = (p.priceInfo && p.priceInfo.standardizedPrices) || [];
    if (sp.length === 0) { console.log('가격: (없음)'); }
    sp.forEach(g => {
        console.log('[' + g.serviceType + '] ' + g.subType + (g.groupType ? ' / ' + g.groupType : ''));
        (g.rows || []).forEach(r => {
            console.log('  ' + r.name + ' = ' + r.price + ' | grade: ' + (r.grade || '') + ' | fee: ' + (r.feeType || 'USAGE') + (r.isRepresentative ? ' *' : ''));
        });
    });
    console.log('');
});
