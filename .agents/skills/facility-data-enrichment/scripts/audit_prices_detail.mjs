import fs from 'fs';

const audit = JSON.parse(fs.readFileSync('data/enrichment/20261003_1750/applied_diff_audit.json', 'utf8'));
const withPrices = audit.filter(f => f.addedPricesCount > 0);
console.log('Facilities with added prices:', withPrices.length);

for (const f of withPrices) {
  console.log('\n[' + f.id + '] ' + f.name + ' (' + f.category + ') - ' + f.address);
  for (const p of f.addedPrices) {
    console.log('  -> [' + p.cat + '] ' + p.name + ' (' + (p.grade || '-') + ') : ' + p.price.toLocaleString() + '원');
  }
}
