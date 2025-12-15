const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

const filePath = path.join(__dirname, '../data/pricing_cemetery.csv');

function run() {
    if (!fs.existsSync(filePath)) {
        console.error('File not found:', filePath);
        return;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // 1. CSV 파싱 (Papaparse)
    const parsed = Papa.parse(fileContent, {
        header: true,
        skipEmptyLines: true,
    });

    // errors 체크 (옵션)
    if (parsed.errors.length > 0) {
        console.warn('Parsing warnings:', parsed.errors);
    }

    const records = parsed.data;
    console.log(`Loaded ${records.length} rows.`);

    // 2. 숫자 추출 및 정렬
    // 숫자 ID 추출 헬퍼
    const getNum = (idStr) => {
        if (!idStr) return 999999;
        const match = idStr.match(/park-(\d+)/);
        return match ? parseInt(match[1], 10) : 999999;
    };

    records.sort((a, b) => {
        const numA = getNum(a.ParkID);
        const numB = getNum(b.ParkID);
        // ID가 같으면 카테고리나 ItemName 등으로 2차 정렬 가능하지만, 현재는 ID만 정렬
        return numA - numB;
    });

    // 3. 결번(누락된 번호) 확인
    const uniqueIds = new Set(records.map(r => getNum(r.ParkID)).filter(n => n !== 999999));
    const sortedIds = Array.from(uniqueIds).sort((a, b) => a - b);

    if (sortedIds.length === 0) {
        console.log('No valid IDs found.');
        return;
    }

    const minId = sortedIds[0];
    const maxId = sortedIds[sortedIds.length - 1];

    console.log(`First ID: park-${String(minId).padStart(4, '0')}`);
    console.log(`Last ID:  park-${String(maxId).padStart(4, '0')}`);
    console.log(`Total Facilities (Unique IDs): ${sortedIds.length}`);

    const existingIdSet = new Set(sortedIds);
    const missingIds = [];

    // minId부터 maxId까지 순회하며 비어있는 번호 찾기 (또는 1부터 찾기? 보통 1부터)
    // "1~마지막 숫자로 변경하고" 라는 요청에 따라 1부터 검사
    for (let i = 1; i <= maxId; i++) {
        if (!existingIdSet.has(i)) {
            missingIds.push(i);
        }
    }

    if (missingIds.length > 0) {
        console.log('\n❌ Missing Numbers (결번 리스트):');
        console.log('--------------------------------------------------');
        // 보기 좋게 출력
        let msg = '';
        missingIds.forEach((id, idx) => {
            msg += `park-${String(id).padStart(4, '0')}  `;
            if ((idx + 1) % 10 === 0) msg += '\n';
        });
        console.log(msg);
        console.log('--------------------------------------------------');
        console.log(`Total Missing Count: ${missingIds.length}`);
    } else {
        console.log('\n✅ 누락된 번호 없음 (1번부터 마지막 번호까지 연속됨)');
    }

    // 4. 정렬된 내용으로 파일 덮어쓰기
    const csvOutput = Papa.unparse(records, {
        header: true,
        newline: '\n', // Force newline if needed
        quotes: false, // Auto-detect quotes need
        quoteChar: '"',
        escapeChar: '"',
    });

    fs.writeFileSync(filePath, csvOutput);
    console.log(`\n📄 Sorted file saved to: ${filePath}`);
}

run();
