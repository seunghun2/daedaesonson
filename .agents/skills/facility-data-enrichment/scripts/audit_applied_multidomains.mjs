import fs from 'fs';

const audit = JSON.parse(fs.readFileSync('data/enrichment/20261003_1750/applied_diff_audit.json', 'utf8'));
const master = JSON.parse(fs.readFileSync('data/enrichment/20261003_1750/master.json', 'utf8'));
const masterMap = new Map(master.facilities.map(f => [f.id, f]));

// Group by domain
const byDomain = new Map();
for (const f of audit) {
  const m = masterMap.get(f.id);
  if (!m || !m.websiteUrl) continue;
  try {
    const host = new URL(m.websiteUrl).hostname.replace(/^www\./, '');
    if (!byDomain.has(host)) byDomain.set(host, []);
    byDomain.get(host).push({ id: f.id, name: f.name, cat: f.category, addr: f.address, addedPrices: f.addedPrices, addedImgs: f.addedImgs });
  } catch {}
}

const multiDomains = [];
for (const [host, list] of byDomain) {
  if (list.length > 1) {
    multiDomains.push({ host, count: list.length, facilities: list });
  }
}

console.log('Multi-facility domains in applied set:', multiDomains.length);
for (const m of multiDomains) {
  console.log('\n=== Domain: ' + m.host + ' (' + m.count + ' facilities) ===');
  for (const f of m.facilities) {
    console.log('  [' + f.id + '] ' + f.name + ' (' + f.cat + ') - ' + f.addr);
    console.log('    added prices: ' + f.addedPrices.length + ', added imgs: ' + f.addedImgs.length);
    if (f.addedPrices.length > 0) {
      console.log('    prices:', f.addedPrices.map(p => p.cat + '/' + p.name + ': ' + p.price));
    }
  }
}
