const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facilities.json'), 'utf8'));
const p = data.find(x => x.id === 'park-0619');

if (!p) { console.log('park-0619 NOT FOUND'); process.exit(); }

console.log('이름:', p.name);
console.log('주소:', p.address);
console.log('websiteUrl:', p.websiteUrl || '없음');
console.log('카테고리:', p.institutionType);

const sp = (p.priceInfo && p.priceInfo.standardizedPrices) || [];
if (sp.length === 0) {
    console.log('가격 데이터: (없음)');
} else {
    sp.forEach(function (g) {
        console.log('[' + g.serviceType + '] ' + g.subType + (g.groupType ? ' / ' + g.groupType : ''));
        (g.rows || []).forEach(function (r) {
            console.log('  ' + r.name + ' = ' + r.price + ' | grade: ' + (r.grade || '') + ' | fee: ' + (r.feeType || 'USAGE') + (r.isRepresentative ? ' *' : ''));
        });
    });
}
