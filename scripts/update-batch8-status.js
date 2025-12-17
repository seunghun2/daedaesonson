const fs = require('fs');
const path = require('path');

// 배치 8 (마지막): 공설로 확인된 시설들 (81개 중 8개)
const publicFacilities = [
    'park-1343', 'park-1358', 'park-1359', 'park-1362', 'park-1395',
    'park-1396', 'park-1400', 'park-1498'
];

// 배치 8: 사설로 확인된 시설들 (73개)
const privateFacilities = [
    'park-1333', 'park-1335', 'park-1336', 'park-1338', 'park-1339',
    'park-1341', 'park-1342', 'park-1344', 'park-1345', 'park-1348',
    'park-1349', 'park-1350', 'park-1351', 'park-1352', 'park-1354',
    'park-1355', 'park-1356', 'park-1357', 'park-1360', 'park-1367',
    'park-1368', 'park-1369', 'park-1371', 'park-1372', 'park-1373',
    'park-1374', 'park-1375', 'park-1376', 'park-1377', 'park-1378',
    'park-1379', 'park-1380', 'park-1381', 'park-1382', 'park-1383',
    'park-1384', 'park-1385', 'park-1386', 'park-1387', 'park-1388',
    'park-1389', 'park-1390', 'park-1391', 'park-1393', 'park-1398',
    'park-1399', 'park-1401', 'park-1402', 'park-1403', 'park-1404',
    'park-1406', 'park-1408', 'park-1410', 'park-1411', 'park-1413',
    'park-1414', 'park-1415', 'park-1416', 'park-1417', 'park-1419',
    'park-1421', 'park-1422', 'park-1423', 'park-1424', 'park-1425',
    'park-1426', 'park-1427', 'park-1429', 'park-1430', 'park-1431',
    'park-1432', 'park-1436', 'park-1497'
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
console.log('');
console.log('🎉 모든 미확인 시설 분류 완료!');
