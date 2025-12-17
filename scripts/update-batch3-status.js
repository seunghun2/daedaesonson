const fs = require('fs');
const path = require('path');

// 배치 3: 공설로 확인된 시설들
const publicFacilities = [
    'park-0476', 'park-0487', 'park-0488', 'park-0500', 'park-0708',
    'park-0722', 'park-0733', 'park-0735', 'park-0736', 'park-0737',
    'park-0742', 'park-0743', 'park-0744', 'park-0745', 'park-0747',
    'park-0749', 'park-0750', 'park-0753', 'park-0755', 'park-0756'
];

// 배치 3: 사설로 확인된 시설들
const privateFacilities = [
    'park-0466', 'park-0467', 'park-0468', 'park-0469', 'park-0470',
    'park-0472', 'park-0474', 'park-0481', 'park-0482', 'park-0483',
    'park-0484', 'park-0485', 'park-0490', 'park-0491', 'park-0502',
    'park-0503', 'park-0505', 'park-0506', 'park-0507', 'park-0643',
    'park-0710', 'park-0712', 'park-0713', 'park-0718', 'park-0723',
    'park-0724', 'park-0726', 'park-0730', 'park-0731', 'park-0738'
];

const facilitiesPath = path.join(__dirname, '../data/facilities.json');
const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf8'));

let publicUpdated = 0;
let privateUpdated = 0;

facilities.forEach(facility => {
    if (publicFacilities.includes(facility.id)) {
        facility.isPublic = true;
        publicUpdated++;
    } else if (privateFacilities.includes(facility.id)) {
        facility.isPublic = false;
        privateUpdated++;
    }
});

fs.writeFileSync(facilitiesPath, JSON.stringify(facilities, null, 2), 'utf8');

console.log(`✅ 공설 ${publicUpdated}개 업데이트`);
console.log(`✅ 사설 ${privateUpdated}개 업데이트`);
console.log(`📊 총 ${publicUpdated + privateUpdated}개 처리 완료`);
