const fs = require('fs');
const path = require('path');

// 배치 7: 공설로 확인된 시설들 (100개 중 32개)
const publicFacilities = [
    'park-1111', 'park-1115', 'park-1116', 'park-1125', 'park-1126',
    'park-1127', 'park-1134', 'park-1139', 'park-1163', 'park-1236',
    'park-1245', 'park-1248', 'park-1249', 'park-1252', 'park-1261',
    'park-1265', 'park-1266', 'park-1272', 'park-1276', 'park-1277',
    'park-1278', 'park-1279', 'park-1280', 'park-1282', 'park-1283',
    'park-1284', 'park-1286', 'park-1291', 'park-1299', 'park-1324',
    'park-1325', 'park-1328'
];

// 배치 7: 사설로 확인된 시설들 (68개)
const privateFacilities = [
    'park-1097', 'park-1098', 'park-1099', 'park-1100', 'park-1102',
    'park-1103', 'park-1104', 'park-1105', 'park-1106', 'park-1107',
    'park-1109', 'park-1110', 'park-1112', 'park-1113', 'park-1114',
    'park-1120', 'park-1122', 'park-1123', 'park-1145', 'park-1146',
    'park-1147', 'park-1148', 'park-1150', 'park-1152', 'park-1154',
    'park-1164', 'park-1165', 'park-1166', 'park-1167', 'park-1168',
    'park-1169', 'park-1170', 'park-1171', 'park-1172', 'park-1238',
    'park-1246', 'park-1247', 'park-1254', 'park-1256', 'park-1260',
    'park-1262', 'park-1264', 'park-1267', 'park-1269', 'park-1294',
    'park-1296', 'park-1302', 'park-1304', 'park-1305', 'park-1307',
    'park-1309', 'park-1310', 'park-1311', 'park-1312', 'park-1313',
    'park-1315', 'park-1316', 'park-1317', 'park-1318', 'park-1320',
    'park-1321', 'park-1322', 'park-1323', 'park-1326', 'park-1327',
    'park-1329', 'park-1330', 'park-1331'
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
