
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '../facility_data/facilities_info_2025-12-12.xlsx');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

function alignListFinally() {
    console.log('🚀 엑셀 순서와 100% 동일하게 줄 세우기 (데이터 보존 + 강제 이동)...');

    // 1. 엑셀 로드
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const excelRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`📄 엑셀 목표: ${excelRows.length}개`);

    // 2. 현재 데이터 로드
    const currentFacilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`📦 현재 데이터: ${currentFacilities.length}개`);

    // 3. 검색 테이블 생성
    // (이름+주소), (이름Only), (주소Only) 등으로 최대한 찾아서 매칭하려고 준비
    const pool = new Map();

    currentFacilities.forEach(fac => {
        // 검색 키들을 다 만들어서 pool에 넣음 (중복되면 덮어씀 - 어차피 하나만 있으면 됨)
        const nameNorm = normalize(fac.name);
        const addrNorm = normalize(fac.address);

        // 우선순위 1: 이름+주소
        pool.set(`FULL:${nameNorm}|${addrNorm}`, fac);
        // 우선순위 2: 이름
        if (!pool.has(`NAME:${nameNorm}`)) pool.set(`NAME:${nameNorm}`, fac);
        // 우선순위 3: 자모 무시 이름
        const jamoFree = cleanString(nameNorm);
        if (!pool.has(`JAMO:${jamoFree}`)) pool.set(`JAMO:${jamoFree}`, fac);
    });

    const finalList = [];
    const missingNames = [];

    // 4. 엑셀 순서대로 Loop
    excelRows.forEach((row, idx) => {
        const name = (row['시설명'] || '').trim();
        const addr = (row['주소'] || '').trim();
        const normName = normalize(name);
        const normAddr = normalize(addr);

        // 1. 매칭 
        let match = pool.get(`FULL:${normName}|${normAddr}`);
        if (!match) match = pool.get(`NAME:${normName}`); // 이름만 같아도 일단 데려옴
        if (!match) match = pool.get(`JAMO:${cleanString(normName)}`); // 자모 깨진거라도 데려옴

        // 2. ID 생성 (park-0001 ~ park-1498)
        const newId = `park-${String(idx + 1).padStart(4, '0')}`;

        if (match) {
            // 찾았다! -> 이 녀석을 납치해서 ID 바꾸고 줄 세움
            finalList.push({
                ...match,
                id: newId, // ID는 무조건 줄 번호로 변경
                // 이름/주소는 엑셀이 Master니까 엑셀 걸로 업데이트? (선택)
                // 고객님이 '데이터 보존'을 원했으니, 만약 match 정보가 부실하면 엑셀거 씀
                name: name, // 엑셀 이름으로 통일 (깨진 한글 방지)
                address: addr // 엑셀 주소로 통일
            });
        } else {
            // 못 찾았다! (엑셀엔 있는데 우리 파일엔 없는 놈)
            // -> 빈 껍데기라도 만들어서 자리를 채워야 함 (그래야 park-1208이 밀리지 않음)
            missingNames.push(name);
            finalList.push({
                id: newId,
                name: name,
                address: addr,
                category: mapCategory(row['구분']),
                tel: row['전화번호'] || '',
                capacity: parseInt(row['총매장능력'] || '0') || null,
                coordinates: { lat: 0, lng: 0 }, // 좌표 없음 (추후 채워야 함)
                images: [],
                updatedAt: new Date().toISOString()
            });
        }
    });

    console.log(`✨ 최종 리스트: ${finalList.length}개`);
    console.log(`✅ 매칭 성공: ${finalList.length - missingNames.length}개`);
    console.log(`⚠️ 매칭 실패(신규 생성): ${missingNames.length}개`);

    // 검증: 늘푸른목장 (No.1208)
    if (finalList.length >= 1208) {
        console.log(`🎯 [검증] 1208번째 시설: ${finalList[1207].id} / ${finalList[1207].name}`);
    }

    // 5. 저장
    fs.writeFileSync(JSON_PATH, JSON.stringify(finalList, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

function normalize(str) {
    return (str || '').normalize('NFC').replace(/\s+/g, ''); // 공백제거 비교
}

function cleanString(str) {
    return str.replace(/[^가-힣a-zA-Z0-9]/g, '');
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

alignListFinally();
