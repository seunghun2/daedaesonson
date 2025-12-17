const fs = require('fs');
const path = require('path');

// 배치 4: 공설로 확인된 시설들
const publicFacilities = [
    'park-0758', 'park-0762', 'park-0763', 'park-0771', 'park-0777',
    'park-0779', 'park-0785', 'park-0786', 'park-0788', 'park-0793',
    'park-0797', 'park-0799', 'park-0805', 'park-0806', 'park-0812',
    'park-0813', 'park-0816', 'park-0825', 'park-0827', 'park-0830',
    'park-0833', 'park-0846'
];

// 배치 4: 사설로 확인된 시설들
const privateFacilities = [
    'park-0757', 'park-0765', 'park-0767', 'park-0768', 'park-0773',
    'park-0775', 'park-0778', 'park-0782', 'park-0789', 'park-0790',
    'park-0792', 'park-0798', 'park-0800', 'park-0802', 'park-0803',
    'park-0804', 'park-0810', 'park-0814', 'park-0815', 'park-0817',
    'park-0818', 'park-0821', 'park-0823', 'park-0831', 'park-0834',
    'park-0835', 'park-0837', 'park-0847'
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
