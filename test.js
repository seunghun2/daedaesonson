const fs = require('fs');
const d = JSON.parse(fs.readFileSync('data/facilities.json'));
const p = d.find(x => x.id === 'park-0005');
const nocat = p.priceInfo.standardizedPrices[0].rows.filter(r => r.feeType !== 'MAINTENANCE' && !r.groupType);
console.log('Items without groupType (not maintenance):', nocat.length);
console.log(nocat);
