
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

function normalizeHangulData() {
    console.log('🛠 한글 자모 분리 현상(NFD) 수정 중...');

    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
    let fixedCount = 0;

    const fixedData = data.map(fac => {
        let isChanged = false;

        // 이름 정규화
        if (fac.name && fac.name !== fac.name.normalize('NFC')) {
            fac.name = fac.name.normalize('NFC');
            isChanged = true;
        }

        // 주소 정규화
        if (fac.address && fac.address !== fac.address.normalize('NFC')) {
            fac.address = fac.address.normalize('NFC');
            isChanged = true;
        }

        if (isChanged) fixedCount++;
        return fac;
    });

    console.log(`✅ 총 ${fixedCount}개의 깨진 한글 데이터를 복구했습니다.`);

    // 저장
    fs.writeFileSync(JSON_PATH, JSON.stringify(fixedData, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

normalizeHangulData();
