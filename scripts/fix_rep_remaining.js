const fs = require('fs');
const fp = './data/facilities.json';
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// park-0050: 묘지사용료 (1평)
const p50 = data.find(d => d.id === 'park-0050');
p50.priceInfo.standardizedPrices.forEach(sp => {
    sp.rows.forEach(r => {
        if (r.name === '묘지사용료 (1평)' && sp.subType === '매장묘') {
            r.isRepresentative = true;
            console.log('50 ★ ' + r.name + '=' + r.price);
        }
    });
});

// park-0052: 매장묘 (하단구역) — 가장 기본 사용료
const p52 = data.find(d => d.id === 'park-0052');
p52.priceInfo.standardizedPrices.forEach(sp => {
    sp.rows.forEach(r => {
        if (r.name === '매장묘 (하단구역)' && sp.subType === '매장묘') {
            r.isRepresentative = true;
            console.log('52 ★ ' + r.name + '=' + r.price);
        }
    });
});

// park-0053: 묘지 사용료 (1평)
const p53 = data.find(d => d.id === 'park-0053');
p53.priceInfo.standardizedPrices.forEach(sp => {
    sp.rows.forEach(r => {
        if (r.name === '묘지 사용료 (1평)' && sp.subType === '매장묘') {
            r.isRepresentative = true;
            console.log('53 ★ ' + r.name + '=' + r.price);
        }
    });
});

// park-0060: 묘지대 (3.3㎡)
const p60 = data.find(d => d.id === 'park-0060');
p60.priceInfo.standardizedPrices.forEach(sp => {
    sp.rows.forEach(r => {
        if (r.name === '묘지대 (3.3㎡)' && sp.subType === '매장묘') {
            r.isRepresentative = true;
            console.log('60 ★ ' + r.name + '=' + r.price);
        }
    });
});

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ 50,52,53,60 isRepresentative 설정 완료!');
