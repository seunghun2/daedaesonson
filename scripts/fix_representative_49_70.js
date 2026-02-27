const fs = require('fs');
const fp = './data/facilities.json';
const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

// 각 공원별 isRepresentative를 찍을 행의 name 패턴
const repMap = {
    'park-0050': { match: (r, sp) => r.name === '사용료 (3.3㎡)' && sp.subType === '매장묘' },
    'park-0051': { match: (r, sp) => r.name.includes('묘지 사용료') && sp.subType === '매장묘' },
    'park-0052': { match: (r, sp) => r.name === '사용료' && sp.subType === '매장묘' },
    'park-0053': { match: (r, sp) => r.name.includes('묘지사용료') && sp.subType === '매장묘' },
    'park-0054': { match: (r, sp) => r.name.includes('묘지사용료') && sp.subType === '매장묘' },
    'park-0055': { match: (r, sp) => r.name.includes('사용료') && sp.subType === '매장묘' },
    'park-0056': { match: (r, sp) => r.name === '정명지' && sp.subType === '매장묘' },
    'park-0057': { match: (r, sp) => r.name.includes('사용료') && sp.subType.includes('장') && !r.feeType },
    'park-0058': { match: (r, sp) => r.name.includes('사용료') && sp.subType === '매장묘' },
    'park-0059': { match: (r, sp) => r.name.includes('묘지사용료') && sp.subType === '매장묘' },
    'park-0060': { match: (r, sp) => r.name.includes('사용료') && sp.subType === '매장묘' },
    'park-0061': { match: (r, sp) => r.name === '사용료' && sp.subType === '단장형' },
    'park-0062': { match: (r, sp) => r.name === '묘지 사용료' && sp.subType === '매장묘' },
    'park-0063': { match: (r, sp) => r.name === '하절기' && r.groupType === '일반' && sp.subType === '단장형' },
    'park-0064': { match: (r, sp) => r.name === '사용료 (30년)' && r.residency === 'LOCAL' && sp.subType === '단장형' },
    'park-0065': { match: (r, sp) => r.name === '묘지대' && sp.subType === '매장묘' },
    'park-0066': { match: (r, sp) => r.name.includes('묘지사용료') && sp.subType === '매장묘' },
    'park-0067': { match: (r, sp) => r.name === '관리비 (3평)' && sp.subType === '매장묘' },
};

let count = 0;
for (const [parkId, config] of Object.entries(repMap)) {
    const park = data.find(p => p.id === parkId);
    if (!park || !park.priceInfo || !park.priceInfo.standardizedPrices) {
        console.log(parkId + ': NOT FOUND');
        continue;
    }
    let found = false;
    park.priceInfo.standardizedPrices.forEach(sp => {
        sp.rows.forEach(r => {
            if (config.match(r, sp)) {
                r.isRepresentative = true;
                console.log(parkId + ' ★ ' + sp.subType + '/' + r.name + '=' + r.price);
                found = true;
            }
        });
    });
    if (!found) console.log(parkId + ': NO MATCH FOUND!');
    else count++;
}

fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
console.log('\n✅ ' + count + '개 공원 isRepresentative 설정 완료!');
