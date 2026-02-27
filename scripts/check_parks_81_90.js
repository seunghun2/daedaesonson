const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf8'));

for (let i = 81; i <= 90; i++) {
    const id = 'park-00' + i;
    const p = data.find(d => d.id === id);
    if (!p) { console.log(id + ': NOT FOUND'); continue; }
    console.log('=== ' + id + ' ' + p.name + ' ===');

    if (!p.priceInfo || !p.priceInfo.standardizedPrices || p.priceInfo.standardizedPrices.length === 0) {
        console.log('  NO standardizedPrices');
        if (p.priceInfo && p.priceInfo.priceTable) {
            Object.keys(p.priceInfo.priceTable).forEach(k => {
                const cat = p.priceInfo.priceTable[k];
                if (cat && Array.isArray(cat.rows) && cat.rows.length > 0) {
                    console.log('  [PT] ' + k + ': ' + cat.rows.length + ' rows');
                    cat.rows.forEach((r, ri) => {
                        console.log('    r' + ri + ': ' + r.name + ' | ' + r.price + ' | g=' + (r.grade || '') + ' | rep=' + (r.isRepresentative || false));
                    });
                }
            });
        }
        continue;
    }

    p.priceInfo.standardizedPrices.forEach((sp, idx) => {
        console.log('  [' + idx + '] sub=' + sp.subType);
        if (sp.rows) sp.rows.forEach((r, ri) => {
            let info = '    r' + ri + ': ' + r.name + ' | ' + r.price;
            if (r.feeType) info += ' | ft=' + r.feeType;
            if (r.residency) info += ' | res=' + r.residency;
            if (r.isRepresentative) info += ' | ★';
            if (r.grade) info += ' | GRADE=' + r.grade;
            if (r.note) info += ' | note=' + r.note;
            console.log(info);
        });
    });

    // check priceTable overlap
    if (p.priceInfo && p.priceInfo.priceTable) {
        const ptKeys = Object.keys(p.priceInfo.priceTable).filter(k => {
            const cat = p.priceInfo.priceTable[k];
            return cat && Array.isArray(cat.rows) && cat.rows.length > 0;
        });
        if (ptKeys.length > 0) console.log('  ⚠️ priceTable에도 데이터 있음: ' + ptKeys.join(', '));
    }
}
