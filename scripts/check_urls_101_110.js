const data = JSON.parse(require('fs').readFileSync('data/facilities.json', 'utf8'));
for (let i = 101; i <= 110; i++) {
    const id = 'park-' + String(i).padStart(4, '0');
    const p = data.find(d => d.id === id);
    if (!p) continue;
    const url = p.websiteUrl || p.portalUrl || p.sourceUrl || '(없음)';
    console.log(id + ' ' + p.name + ' | ' + url);
}
