const fs = require('fs');
const path = require('path');

// 배치 5: 공설로 확인된 시설들 (80개 중)
const publicFacilities = [
    'park-0849', 'park-0855', 'park-0858', 'park-0863', 'park-0864',
    'park-0866', 'park-0867', 'park-0868', 'park-0870', 'park-0872',
    'park-0873', 'park-0874', 'park-0875', 'park-0877', 'park-0878',
    'park-0879', 'park-0882', 'park-0909'
];

// 배치 5: 사설로 확인된 시설들
const privateFacilities = [
    'park-0848', 'park-0852', 'park-0853', 'park-0857', 'park-0871',
    'park-0876', 'park-0880', 'park-0881', 'park-0883', 'park-0884',
    'park-0886', 'park-0887', 'park-0888', 'park-0889', 'park-0890',
    'park-0892', 'park-0894', 'park-0896', 'park-0897', 'park-0898',
    'park-0899', 'park-0900', 'park-0902', 'park-0903', 'park-0906',
    'park-0907', 'park-0911', 'park-0912', 'park-0913', 'park-0916',
    'park-0917', 'park-0918', 'park-0919', 'park-0920', 'park-0922',
    'park-0923', 'park-0925', 'park-0926', 'park-0927', 'park-0928',
    'park-0929', 'park-0930', 'park-0932', 'park-0933', 'park-0934',
    'park-0938', 'park-0939', 'park-0940', 'park-0942', 'park-0944',
    'park-0946', 'park-0947', 'park-0950', 'park-0954', 'park-0955',
    'park-0958', 'park-0960', 'park-0961', 'park-0963', 'park-0964',
    'park-0965', 'park-0967'
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
