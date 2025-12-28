const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

let updated = 0;

facilities.forEach(f => {
    if (!f.amenities) return;

    // amenities.parking → hasParking 변환
    if (f.amenities.parking) {
        f.hasParking = true;
        updated++;
    }
    if (f.amenities.restaurant) {
        f.hasRestaurant = true;
        updated++;
    }
    if (f.amenities.store) {
        f.hasStore = true;
        updated++;
    }
    if (f.amenities.accessibility) {
        f.hasAccessibility = true;
        updated++;
    }

    // amenities는 삭제하지 않고 유지 (parkingSpaces 정보 때문에)
});

fs.writeFileSync('data/facilities.json', JSON.stringify(facilities, null, 2), 'utf8');

console.log(`✅ 완료!`);
console.log(`총 ${updated}개 필드 변환`);

const stats = {
    hasParking: facilities.filter(f => f.hasParking).length,
    hasRestaurant: facilities.filter(f => f.hasRestaurant).length,
    hasStore: facilities.filter(f => f.hasStore).length,
    hasAccessibility: facilities.filter(f => f.hasAccessibility).length,
    parkingSpaces: facilities.filter(f => f.amenities?.parkingSpaces).length
};

console.log(`\n📊 편의시설 통계:`);
console.log(`주차장: ${stats.hasParking}개`);
console.log(`식당: ${stats.hasRestaurant}개`);
console.log(`매점: ${stats.hasStore}개`);
console.log(`장애인편의: ${stats.hasAccessibility}개`);
console.log(`주차 대수 정보: ${stats.parkingSpaces}개`);
