
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '../facility_data/facilities_info_2025-12-12.xlsx');
const CURRENT_JSON_PATH = path.join(__dirname, '../data/facilities.json');

function renumberAndAlignToExcel() {
    console.log('📏 엑셀 순서대로 ID 전면 재발급 및 정렬 작업 시작 (1~1498)...');

    // 1. 엑셀 로드 (순서의 기준)
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet);
    console.log(`📄 엑셀 원본 행 수: ${excelRows.length}개`);

    // 2. 현재 데이터 로드 (좌표/이미지/정보 창고)
    const currentData = JSON.parse(fs.readFileSync(CURRENT_JSON_PATH, 'utf8'));
    console.log(`📦 현재 보유 데이터: ${currentData.length}개`);

    // 3. 매핑 딕셔너리 생성 (Key: 이름+주소 -> Value: Facility 객체)
    // 중복된 경우, 정보가 더 많은 쪽을 우선하거나 덮어씀
    const infoMap = new Map();
    currentData.forEach(fac => {
        const key = (fac.name + fac.address).replace(/\s+/g, '');
        // 기존 맵에 없거나, 현재 fac가 좌표가 있다면 덮어쓰기 (좌표 있는게 더 소중함)
        if (!infoMap.has(key)) {
            infoMap.set(key, fac);
        } else {
            const existing = infoMap.get(key);
            if (isBetter(fac, existing)) {
                infoMap.set(key, fac);
            }
        }
    });

    // 4. 리스트 재조립 (엑셀 순서 loop)
    const alignedList = excelRows.map((row, index) => {
        // ID 생성 (park-0001 ~ park-1498)
        const newId = `park-${String(index + 1).padStart(4, '0')}`;

        const name = row['시설명'] || '이름없음';
        const address = row['주소'] || '';
        const key = (name + address).replace(/\s+/g, '');

        // 기존 정보 찾아오기
        const existingInfo = infoMap.get(key);

        // 엑셀의 용량 정보 파싱
        let capacity = null;
        const rawCapacity = row['총매장능력'];
        if (rawCapacity !== undefined && rawCapacity !== null && rawCapacity !== '') {
            capacity = parseInt(rawCapacity);
            if (isNaN(capacity)) capacity = null;
        }

        // 기본 객체 생성
        const fac = {
            id: newId,
            name: name,
            address: address,
            category: mapCategory(row['구분']),
            tel: row['전화번호'] || (existingInfo ? existingInfo.tel : ''),
            capacity: capacity, // 엑셀 우선

            // 기존 데이터에서 보존해야 할 중요 정보들
            coordinates: (existingInfo && existingInfo.coordinates) ? existingInfo.coordinates : { lat: 0, lng: 0 },
            images: (existingInfo && existingInfo.images) ? existingInfo.images : [],
            priceRange: existingInfo ? existingInfo.priceRange : { min: 0, max: 0 },
            rating: existingInfo ? existingInfo.rating : 0,
            reviewCount: existingInfo ? existingInfo.reviewCount : 0,

            updatedAt: new Date().toISOString()
        };

        return fac;
    });

    console.log(`✨ 재조립 완료: ${alignedList.length}개`);
    console.log(`   첫번째 ID: ${alignedList[0].id} (${alignedList[0].name})`);
    console.log(`   마지막 ID: ${alignedList[alignedList.length - 1].id} (${alignedList[alignedList.length - 1].name})`);

    // 5. 저장
    fs.writeFileSync(CURRENT_JSON_PATH, JSON.stringify(alignedList, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

// 헬퍼: 더 나은 데이터인지 판단 (좌표 유무가 깡패)
function isBetter(newOne, oldOne) {
    const newHasCoord = newOne.coordinates && (newOne.coordinates.lat !== 0 || newOne.coordinates.lng !== 0);
    const oldHasCoord = oldOne.coordinates && (oldOne.coordinates.lat !== 0 || oldOne.coordinates.lng !== 0);

    if (newHasCoord && !oldHasCoord) return true;
    if (!newHasCoord && oldHasCoord) return false;

    // 둘 다 있거나 둘 다 없으면 이미지 개수?
    const newImgs = newOne.images ? newOne.images.length : 0;
    const oldImgs = oldOne.images ? oldOne.images.length : 0;
    return newImgs > oldImgs;
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

renumberAndAlignToExcel();
