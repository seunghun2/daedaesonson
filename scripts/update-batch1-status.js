const fs = require('fs');
const path = require('path');

// 배치 1: 50개 중 공설로 확인된 시설들
const publicFacilities = [
    'park-0105', 'park-0109', 'park-0119', 'park-0121', 'park-0122',
    'park-0130', 'park-0136', 'park-0141', 'park-0151', 'park-0162',
    'park-0163', 'park-0165', 'park-0166', 'park-0167', 'park-0192',
    'park-0205', 'park-0214', 'park-0250', 'park-0260', 'park-0282'
];

// 배치 1: 사설로 확인된 시설들
const privateFacilities = [
    'park-0033', 'park-0116', 'park-0132', 'park-0139', 'park-0143',
    'park-0146', 'park-0147', 'park-0148', 'park-0149', 'park-0155',
    'park-0156', 'park-0158', 'park-0161', 'park-0169', 'park-0172',
    'park-0178', 'park-0193', 'park-0216', 'park-0221', 'park-0227',
    'park-0228', 'park-0242', 'park-0244', 'park-0254', 'park-0266',
    'park-0268', 'park-0269', 'park-0270', 'park-0285', 'park-0290'
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
