const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

let movedCount = 0;
let affectedFacilities = 0;

facilities.forEach(f => {
    if (!f.priceInfo?.priceTable) return;

    const priceTable = f.priceInfo.priceTable;

    // 봉안당에서 평장묘 찾아서 매장묘로 이동
    if (priceTable['봉안당']?.rows) {
        const bongRows = priceTable['봉안당'].rows;
        const toMove = [];
        const toKeep = [];

        bongRows.forEach(row => {
            const name = (row.name || '').toLowerCase();
            if (/평장|평분|평묘/.test(name)) {
                toMove.push(row);
            } else {
                toKeep.push(row);
            }
        });

        if (toMove.length > 0) {
            // 매장묘 카테고리 없으면 생성
            if (!priceTable['매장묘']) {
                priceTable['매장묘'] = { unit: '원', rows: [] };
            }

            // 이동
            priceTable['매장묘'].rows.push(...toMove);
            priceTable['봉안당'].rows = toKeep;

            movedCount += toMove.length;
            affectedFacilities++;

            console.log(`✅ ${f.name}: ${toMove.length}개 항목 이동 (봉안당 → 매장묘)`);
            toMove.forEach(r => console.log(`   - ${r.name}`));
        }
    }
});

// 저장
fs.writeFileSync('./data/facilities.json', JSON.stringify(facilities, null, 2));

console.log(`\n📊 완료!`);
console.log(`   ${affectedFacilities}개 시설에서 ${movedCount}개 항목 이동됨`);
