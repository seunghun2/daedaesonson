const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

// 실패한 항목 찾기 (좌표가 granular/OSM 방식으로 설정된 곳)
function main() {
    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));

    const failedItems = [];

    facilities.forEach((f, idx) => {
        // 주소는 있는데 좌표가 없거나, 좌표가 0,0인 경우
        if (f.address && (!f.coordinates || (f.coordinates.lat === 0 && f.coordinates.lng === 0))) {
            failedItems.push({
                index: idx + 1,
                name: f.name,
                address: f.address,
                category: f.category
            });
        }
    });

    console.log('❌ 네이버 Geocoding 실패 항목 리스트\n');
    console.log(`총 ${failedItems.length}개\n`);

    failedItems.forEach(item => {
        console.log(`[${item.index}] ${item.name}`);
        console.log(`    주소: ${item.address}`);
        console.log(`    카테고리: ${item.category}\n`);
    });

    if (failedItems.length === 0) {
        console.log('✅ 모든 시설이 성공적으로 좌표 변환되었습니다!');
    }
}

main();
