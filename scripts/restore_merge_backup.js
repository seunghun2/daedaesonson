
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '../facility_data/facilities_info_2025-12-12.xlsx');
const BACKUP_PATH = path.join(__dirname, '../data/facilities_backup.json'); // 1498개 존재 확인됨
const CURRENT_PATH = path.join(__dirname, '../data/facilities.json');

function restorePerfectly() {
    console.log('💎 완벽 복구 시작 (Excel + Backup Merge)...');

    // 1. Source 로드
    const excelWorkbook = XLSX.readFile(EXCEL_PATH);
    const excelSheet = excelWorkbook.Sheets[excelWorkbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(excelSheet); // 1498개
    console.log(`📄 엑셀 데이터: ${excelRows.length}개`);

    const backupData = JSON.parse(fs.readFileSync(BACKUP_PATH, 'utf8'));
    console.log(`📦 백업 데이터: ${backupData.length}개`);

    const currentData = JSON.parse(fs.readFileSync(CURRENT_PATH, 'utf8'));
    console.log(`📂 현재 데이터: ${currentData.length}개`);

    // 2. 검색 인덱스 생성 (백업 데이터 & 현재 데이터)
    // Key: Name + Address (spaceless)
    const backupMap = new Map();
    backupData.forEach(fac => {
        const key = (fac.name + fac.address).replace(/\s+/g, '');
        // 중복 시 마지막 것, 혹은 정보 많은 것? 일단 덮어씀
        backupMap.set(key, fac);
    });

    const currentMap = new Map();
    currentData.forEach(fac => {
        const key = (fac.name + fac.address).replace(/\s+/g, '');
        currentMap.set(key, fac);
    });

    // 3. 엑셀 순서대로 병합
    const finalFacilities = [];
    const idSet = new Set();
    let duplicateIdCount = 0;

    excelRows.forEach((row, idx) => {
        const name = row['시설명'] || '이름없음';
        const address = row['주소'] || '';
        const rawCapacity = row['총매장능력'];

        let capacity = null;
        if (rawCapacity !== undefined && rawCapacity !== null && rawCapacity !== '') {
            capacity = parseInt(rawCapacity);
            if (isNaN(capacity)) capacity = null;
        }

        const key = (name + address).replace(/\s+/g, '');

        // 우선순위: 현재 데이터 > 백업 데이터 > 엑셀 신규 생성
        let baseData = currentMap.get(key) || backupMap.get(key);

        // ID 생성 (기존 ID 유지 노력, 없으면 Row Index 기반)
        let id = baseData ? baseData.id : `park-${String(idx + 1).padStart(4, '0')}`;

        // ID 중복 방지 (엑셀에 진짜 중복 행이 있을 수 있음 -> 그래도 별도 객체로 취급)
        if (idSet.has(id)) {
            duplicateIdCount++;
            // 기존 ID 뒤에 suffix 붙이거나, 아예 새로운 ID 부여
            // 안전하게 Row Index 기반 ID로 재발급 (중복된 ID를 가진 다른 시설일 수 있으므로)
            id = `park-dup-${String(idx + 1).padStart(4, '0')}`;
        }
        idSet.add(id);

        // 좌표 정보 복구
        let coordinates = { lat: 0, lng: 0 };
        if (baseData && baseData.coordinates && (baseData.coordinates.lat !== 0 || baseData.coordinates.lng !== 0)) {
            coordinates = baseData.coordinates;
        }

        // 이미지 복구
        let images = [];
        if (baseData && baseData.images && baseData.images.length > 0) {
            images = baseData.images;
        }

        const mergedFac = {
            id: id,
            name: name,
            address: address,
            category: mapCategory(row['구분']),
            tel: row['전화번호'] || (baseData ? baseData.tel : ''),
            capacity: capacity, // 엑셀 최우선
            coordinates: coordinates, // 백업/현재 최우선
            images: images, // 백업/현재 최우선
            priceRange: baseData ? baseData.priceRange : { min: 0, max: 0 },
            rating: baseData ? baseData.rating : 0,
            reviewCount: baseData ? baseData.reviewCount : 0,
            updatedAt: new Date().toISOString()
        };

        finalFacilities.push(mergedFac);
    });

    console.log(`✨ 병합 완료: ${finalFacilities.length}개`);
    console.log(`⚠️ ID 중복으로 재발급된 건수: ${duplicateIdCount}건`);

    // 4. 저장
    fs.writeFileSync(CURRENT_PATH, JSON.stringify(finalFacilities, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

function mapCategory(type) {
    if (!type) return 'ETC';
    if (type.includes('봉안')) return 'CHARNEL_HOUSE';
    if (type.includes('자연') || type.includes('수목')) return 'NATURAL_BURIAL';
    if (type.includes('묘지')) return 'FAMILY_GRAVE';
    if (type.includes('화장')) return 'CREMATORIUM';
    if (type.includes('장례')) return 'FUNERAL_HOME';
    return 'ETC';
}

restorePerfectly();
