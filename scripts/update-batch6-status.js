const fs = require('fs');
const path = require('path');

// 배치 6: 공설로 확인된 시설들 (80개 중 3개)
const publicFacilities = [
    'park-1017', 'park-1018', 'park-1030'
];

// 배치 6: 사설로 확인된 시설들 (77개)
const privateFacilities = [
    'park-0971', 'park-0972', 'park-0973', 'park-0974', 'park-0975',
    'park-0977', 'park-0978', 'park-0979', 'park-0980', 'park-0981',
    'park-0982', 'park-0983', 'park-0985', 'park-0986', 'park-0987',
    'park-0988', 'park-0989', 'park-0990', 'park-0991', 'park-0992',
    'park-0993', 'park-0994', 'park-0997', 'park-0998', 'park-0999',
    'park-1000', 'park-1001', 'park-1003', 'park-1004', 'park-1005',
    'park-1006', 'park-1007', 'park-1010', 'park-1031', 'park-1032',
    'park-1033', 'park-1034', 'park-1038', 'park-1039', 'park-1040',
    'park-1041', 'park-1042', 'park-1043', 'park-1045', 'park-1046',
    'park-1047', 'park-1048', 'park-1049', 'park-1051', 'park-1055',
    'park-1056', 'park-1057', 'park-1059', 'park-1062', 'park-1063',
    'park-1064', 'park-1065', 'park-1067', 'park-1070', 'park-1071',
    'park-1072', 'park-1073', 'park-1074', 'park-1075', 'park-1076',
    'park-1079', 'park-1082', 'park-1083', 'park-1084', 'park-1085',
    'park-1087', 'park-1088', 'park-1090', 'park-1091', 'park-1092',
    'park-1093', 'park-1095'
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
