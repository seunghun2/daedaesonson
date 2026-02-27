const data = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
for (let i = 101; i <= 110; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const p = data.find(d => d.id === id);
    if (!p) continue;
    const keys = Object.keys(p).filter(k => k.toLowerCase().includes('url') || k.toLowerCase().includes('link') || k.toLowerCase().includes('source') || k.toLowerCase().includes('portal'));
    console.log(id + ' ' + p.name);
    keys.forEach(k => console.log('  ' + k + ': ' + p[k]));
    if (p.priceInfo && p.priceInfo.source) console.log('  priceInfo.source: ' + p.priceInfo.source);
    if (p.priceInfo && p.priceInfo.sourceUrl) console.log('  priceInfo.sourceUrl: ' + p.priceInfo.sourceUrl);
}
