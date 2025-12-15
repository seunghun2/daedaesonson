
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '../facility_data/facilities_info_2025-12-12.xlsx');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

function alignListSuperStrict() {
    console.log('🔥 엑셀 vs JSON 강제 매칭 및 정렬 (버그 수정판)...');

    // 1. 데이터 로드 (시트 이름 자동 감지)
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheetName = workbook.SheetNames[0];
    const excelRows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    console.log(`📄 엑셀 로드: ${excelRows.length}행`);

    const currentFacilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`📦 JSON 로드: ${currentFacilities.length}개`);

    // 2. 검색 맵 생성
    const exactMap = new Map();
    const nameMap = new Map();
    const fuzzyMap = new Map();

    currentFacilities.forEach(fac => {
        const normName = normalize(fac.name);
        const normAddr = normalize(fac.address);

        exactMap.set(normName + normAddr, fac);
        nameMap.set(normName, fac);
        fuzzyMap.set(cleanString(normName), fac);
    });

    // 3. 정렬 실행
    const alignedList = [];
    let matchCount = 0;
    let failCount = 0;

    excelRows.forEach((row, idx) => {
        const name = normalize(row['시설명'] || '');
        const addr = normalize(row['주소'] || '');
        const fuzzyName = cleanString(name);

        // 매칭 시도
        let match = exactMap.get(name + addr);
        if (!match) match = nameMap.get(name);
        if (!match) match = fuzzyMap.get(fuzzyName);

        // 주소 매칭 (너무 위험해서 뺌. 이름 다른데 주소 같을 수 있음?)

        if (match) {
            alignedList.push(match);
            matchCount++;
        } else {
            // 매칭 실패 시 -> 일단 깡통 데이터라도 넣어서 자리 차지 (순서 유지 중요)
            console.log(`❌ [No.${idx + 1}] 매칭 실패: ${name}`);
            const tempFac = {
                id: `park-missing-${idx + 1}`,
                name: row['시설명'],
                address: row['주소'],
                category: 'ETC',
                coordinates: { lat: 0, lng: 0 },
                images: [],
                updatedAt: new Date().toISOString()
            };
            alignedList.push(tempFac);
            failCount++;
        }
    });

    console.log(`✨ 최종 결과: ${alignedList.length}개 (매칭:${matchCount}, 실패:${failCount})`);

    // 4. 저장
    fs.writeFileSync(JSON_PATH, JSON.stringify(alignedList, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

function normalize(str) {
    return (str || '').normalize('NFC').trim();
}

function cleanString(str) {
    return str.replace(/[\s\(\)\[\]\{\}\.\,\-]/g, '');
}

alignListSuperStrict();
