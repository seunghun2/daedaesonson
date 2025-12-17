const fs = require('fs');
const path = require('path');

// 배치 2: 공설로 확인된 시설들
const publicFacilities = [
    'park-0292', 'park-0302', 'park-0321', 'park-0343', 'park-0348',
    'park-0358', 'park-0365', 'park-0369', 'park-0380', 'park-0395',
    'park-0396', 'park-0401', 'park-0402', 'park-0415', 'park-0417',
    'park-0424'
];

// 배치 2: 사설로 확인된 시설들
const privateFacilities = [
    'park-0293', 'park-0301', 'park-0304', 'park-0307', 'park-0311',
    'park-0338', 'park-0339', 'park-0341', 'park-0352', 'park-0360',
    'park-0371', 'park-0391', 'park-0409', 'park-0431', 'park-0436',
    'park-0437', 'park-0438', 'park-0439', 'park-0442', 'park-0443',
    'park-0444', 'park-0446', 'park-0448', 'park-0449', 'park-0450',
    'park-0451', 'park-0453', 'park-0454', 'park-0456', 'park-0457',
    'park-0458', 'park-0459', 'park-0460', 'park-0462', 'park-0463',
    'park-0465'
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
