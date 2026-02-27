const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf8'));

const parks = data.filter(f => {
    const num = parseInt(f.id.replace('park-', ''), 10);
    return num >= 1 && num <= 10;
});

parks.forEach(p => {
    console.log('=== ' + p.name + ' (' + p.id + ') ===');
    if (!p.priceInfo || !p.priceInfo.standardizedPrices) {
        console.log('No prices.');
        return;
    }
    p.priceInfo.standardizedPrices.forEach(group => {
        console.log(`  [${group.serviceType}] ${group.subType}`);

        const groupedRows = {};
        group.rows.forEach(r => {
            const gt = r.groupType || 'None';
            if (!groupedRows[gt]) groupedRows[gt] = [];
            groupedRows[gt].push(r);
        });

        for (const [gt, rows] of Object.entries(groupedRows)) {
            console.log(`    - Group: ${gt}`);
            rows.forEach(r => {
                const feeTypes = r.feeType === 'USAGE' ? '사용료' : r.feeType === 'MAINTENANCE' ? '관리비' : r.feeType;
                const price = (r.price || 0).toLocaleString();
                console.log(`      > ${r.name}: ${price}원 (${feeTypes}) | 단위: ${r.grade || '없음'} | 설명: ${r.note || '없음'}`);
            });
        }
    });
    console.log('');
});
