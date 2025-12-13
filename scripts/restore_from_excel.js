
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 파일 경로
const EXCEL_PATH = path.join(__dirname, '../facility_data/facilities_info_2025-12-12.xlsx');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

// 카테고리 매핑
function mapCategory(type) {
    if (!type) return 'ETC';
    if (type.includes('봉안')) return 'CHARNEL_HOUSE';
    if (type.includes('자연') || type.includes('수목')) return 'NATURAL_BURIAL';
    if (type.includes('묘지')) return 'FAMILY_GRAVE';
    if (type.includes('화장')) return 'CREMATORIUM';
    if (type.includes('장례')) return 'FUNERAL_HOME';
    return 'ETC';
}

function restoreFacilities() {
    console.log('🔄 시설 데이터 복구 시작...');

    // 1. JSON 읽기
    const jsonContent = fs.readFileSync(JSON_PATH, 'utf8');
    const currentFacilities = JSON.parse(jsonContent);
    console.log(`📂 현재 JSON 시설 수: ${currentFacilities.length}개`);

    // 2. Excel 읽기
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet);
    console.log(`📊 엑셀 원본 시설 수: ${excelRows.length}개`);

    // 3. 매핑 맵 생성 (Name + Address 기준)
    const jsonMap = new Map();
    let maxIdNum = 0;

    currentFacilities.forEach(fac => {
        // 키 생성: 이름 + 주소 공백제거
        const key = (fac.name + fac.address).replace(/\s+/g, '');
        jsonMap.set(key, fac);

        // ID 파싱 (park-XXXX)
        const match = fac.id.match(/park-(\d+)/);
        if (match) {
            const num = parseInt(match[1]);
            if (num > maxIdNum) maxIdNum = num;
        }
    });

    console.log(`🔑 기존 데이터 ID 최대값: ${maxIdNum}`);

    // 4. 복구 진행
    let restoredCount = 0;
    const finalFacilities = [...currentFacilities];

    excelRows.forEach(row => {
        const name = row['시설명'] || '';
        const address = row['주소'] || '';
        const rawCapacity = row['총매장능력'];

        let capacity = null;
        if (rawCapacity !== undefined && rawCapacity !== null && rawCapacity !== '') {
            capacity = parseInt(rawCapacity);
            if (isNaN(capacity)) capacity = null;
        }

        const key = (name + address).replace(/\s+/g, '');

        if (!jsonMap.has(key)) {
            // 🚨 누락된 시설 발견! -> 복구
            restoredCount++;
            maxIdNum++; // 새 ID 발급
            const newId = `park-${String(maxIdNum).padStart(4, '0')}`;

            const newFacility = {
                id: newId,
                name: name,
                address: address,
                category: mapCategory(row['구분']),
                tel: row['전화번호'] || '',
                capacity: capacity,
                coordinates: { lat: 0, lng: 0 }, // 좌표는 일단 0, 추후 지오코딩 필요
                images: [],
                priceRange: { min: 0, max: 0 },
                rating: 0,
                reviewCount: 0,
                updatedAt: new Date().toISOString()
            };

            finalFacilities.push(newFacility);
            // 중복 방지를 위해 맵에도 추가
            jsonMap.set(key, newFacility);
        }
    });

    console.log(`✅ 복구된 시설 수: ${restoredCount}개`);
    console.log(`✨ 최종 시설 수: ${finalFacilities.length}개`);

    // 5. 저장
    // ID 기준으로 정렬
    finalFacilities.sort((a, b) => {
        const numA = parseInt(a.id.split('-')[1] || '0');
        const numB = parseInt(b.id.split('-')[1] || '0');
        return numA - numB;
    });

    fs.writeFileSync(JSON_PATH, JSON.stringify(finalFacilities, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

restoreFacilities();
