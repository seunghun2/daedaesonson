const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

async function updateFacilitiesFromExcel() {
    console.log('📊 엑셀 데이터 읽기 시작...');

    // 1. 엑셀 파일 읽기
    const wb = XLSX.readFile('facility_data/facilities_info_2025-12-12.xlsx');
    const ws = wb.Sheets[wb.SheetNames[0]];
    const excelData = XLSX.utils.sheet_to_json(ws);

    console.log(`✅ 엑셀 데이터: ${excelData.length}개 시설`);

    // 2. facilities.json 읽기 (API가 참조하는 실제 경로)
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    let facilities = [];

    if (fs.existsSync(facilitiesPath)) {
        const fileContent = fs.readFileSync(facilitiesPath, 'utf-8');
        facilities = JSON.parse(fileContent);
        console.log(`✅ 기존 facilities.json: ${facilities.length}개 시설`);

        // 백업
        if (facilities.length > 0) {
            const backupPath = path.join(__dirname, '../data/facilities_backup.json');
            fs.writeFileSync(backupPath, JSON.stringify(facilities, null, 2));
            console.log('💾 백업 완료: facilities_backup.json');
        }
    }

    // 3. 엑셀 데이터로 업데이트 (모든 1498개 처리)
    let updatedCount = 0;

    const updatedFacilities = excelData.map((row, index) => {
        const facilityName = row['시설명'];
        const address = row['주소'];

        // 기존 시설 찾기 (자소 분리 문제 해결을 위해 normalize 사용)
        const existing = facilities.find(f => {
            const fName = (f.name || '').normalize('NFC');
            const targetName = (facilityName || '').normalize('NFC');
            const fAddr = (f.address || '').replace(/\s+/g, '');
            const targetAddr = (address || '').replace(/\s+/g, '');

            return fName === targetName || fAddr === targetAddr;
        });

        if (existing) {
            // 기존 시설 업데이트
            updatedCount++;
            return {
                ...existing,
                phone: row['전화번호'] || existing.phone || null,
                // fax: row['팩스번호'] || null, // 사용자 요청으로 제외
                // fax: row['팩스번호'] || null, // 사용자 요청으로 제외
                capacity: (row['총매장능력'] !== undefined && row['총매장능력'] !== '') ? row['총매장능력'] : (existing.capacity || null),
                lastUpdated: row['업데이트'] || null,
                website: row['홈페이지'] || existing.website || null,
                isPublic: row['구분'] === '공설',
            };
        } else {
            // 새 시설 생성
            return {
                id: `facility_${Date.now()}_${index}`,
                name: facilityName,
                address: address,
                phone: row['전화번호'] || null,
                // fax: row['팩스번호'] || null, // 사용자 요청으로 제외
                capacity: (row['총매장능력'] !== undefined && row['총매장능력'] !== '') ? row['총매장능력'] : null,
                lastUpdated: row['업데이트'] || null,
                website: row['홈페이지'] || null,
                isPublic: row['구분'] === '공설',
                category: 'ETC',
                coordinates: null,
                images: [],
                rating: 0,
                reviewCount: 0,
                hasParking: null,
                operatorType: null,
            };
        }
    });

    const newCount = excelData.length - updatedCount;

    console.log(`\n📊 업데이트 결과:`);
    console.log(`   ✅ 업데이트: ${updatedCount}개`);
    console.log(`   ➕ 신규 추가: ${newCount}개`);
    console.log(`   📝 총 시설: ${updatedFacilities.length}개`);

    // 4. facilities.json 저장
    fs.writeFileSync(facilitiesPath, JSON.stringify(updatedFacilities, null, 2));
    console.log(`\n💾 facilities.json 저장 완료!`);

    return { updatedCount, newCount, total: updatedFacilities.length };
}

// 실행
updateFacilitiesFromExcel()
    .then(result => {
        console.log('\n🎉 완료!');
        process.exit(0);
    })
    .catch(error => {
        console.error('❌ 오류:', error);
        process.exit(1);
    });
