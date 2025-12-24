const fs = require('fs');
const data = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));
const locations = {};

data.forEach(f => {
    if (!f.priceInfo?.priceTable) return;
    Object.entries(f.priceInfo.priceTable).forEach(([cat, catData]) => {
        (catData.rows || []).forEach(row => {
            const text = `${row.name || ''} ${row.grade || ''} ${row.description || ''}`;

            // 층 패턴
            const floor = text.match(/([1-9]|지하)\s*층/);
            if (floor) locations[floor[0]] = (locations[floor[0]] || 0) + 1;

            // 단 패턴
            const dan = text.match(/[1-8]\s*단/);
            if (dan) locations[dan[0]] = (locations[dan[0]] || 0) + 1;

            // 구역/동 패턴
            const zone = text.match(/[A-Z가-힣]\s*구역|[A-Z]\s*동|[가-힣]\s*동/);
            if (zone) locations[zone[0]] = (locations[zone[0]] || 0) + 1;
        });
    });
});

console.log('📍 위치 패턴 분석:');
Object.entries(locations).sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([loc, cnt]) => {
    console.log(`   ${loc}: ${cnt}개`);
});
