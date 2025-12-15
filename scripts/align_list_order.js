
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const EXCEL_PATH = path.join(__dirname, '../facility_data/facilities_info_2025-12-12.xlsx');
const JSON_PATH = path.join(__dirname, '../data/facilities.json');

function alignJsonToExcel() {
    console.log('📏 JSON 리스트 순서를 엑셀(No.1~) 순서와 강제 동기화 (데이터 변경 없음)...');

    // 1. 엑셀 로드 (순서의 기준)
    const workbook = XLSX.readFile(EXCEL_PATH);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const excelRows = XLSX.utils.sheet_to_json(sheet);
    console.log(`📄 엑셀 기준 행: ${excelRows.length}개`);

    // 2. JSON 로드 (데이터 창고)
    const currentFacilities = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    console.log(`📦 JSON 데이터: ${currentFacilities.length}개`);

    // 3. 풀(Pool) 생성 (이름+주소 키로 그룹화)
    // 중복 시설(동명이인)이 있으므로, 배열로 관리해서 하나씩 꺼내 씀
    const facilityPool = new Map();

    currentFacilities.forEach(fac => {
        // 이름 + 주소를 키로 사용 (공백 제거 + NFC 정규화)
        const key = (fac.name + (fac.address || '')).normalize('NFC').replace(/\s+/g, '');

        if (!facilityPool.has(key)) {
            facilityPool.set(key, []);
        }
        facilityPool.get(key).push(fac);
    });

    const alignedList = [];
    const missingInJson = [];

    // 4. 엑셀 순서대로 하나씩 꺼내서 줄 세우기
    excelRows.forEach((row, idx) => {
        const name = row['시설명'] || '';
        const address = row['주소'] || '';
        const key = (name + address).normalize('NFC').replace(/\s+/g, '');

        if (facilityPool.has(key) && facilityPool.get(key).length > 0) {
            // 풀에서 하나 꺼냄 (Shift: 1번 타자 먼저)
            const matchedFac = facilityPool.get(key).shift();
            alignedList.push(matchedFac);
        } else {
            // 매칭 실패 (JSON에 없음?)
            // 예비책: 이름만으로 검색해 볼까? 
            // 일단 로그 남김
            missingInJson.push({ idx: idx + 1, name, address });
        }
    });

    // 5. 남은 찌꺼기 처리 (엑셀엔 없는데 JSON엔 있는거?)
    const leftovers = [];
    facilityPool.forEach((list) => {
        if (list.length > 0) {
            leftovers.push(...list);
        }
    });

    console.log(`✨ 정렬 완료: ${alignedList.length}개 매칭됨`);

    if (leftovers.length > 0) {
        console.log(`⚠️ 엑셀에 없어서 뒤로 밀린 시설: ${leftovers.length}개`);
        // 뒤에 갖다 붙임
        alignedList.push(...leftovers);
    }

    if (missingInJson.length > 0) {
        console.log(`❌ 엑셀엔 있는데 JSON에 없는 시설: ${missingInJson.length}개`);
        missingInJson.slice(0, 5).forEach(m => console.log(`   No.${m.idx} ${m.name}`));
    }

    // 6. 결과 저장
    fs.writeFileSync(JSON_PATH, JSON.stringify(alignedList, null, 2));
    console.log('💾 facilities.json 순서 재배치 저장 완료! (ID, 데이터 보존)');
}

alignJsonToExcel();
