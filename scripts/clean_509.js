const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-701902a77d89.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const SHEET_NAME = '시트1_사설';

function cleanProductName(name) {
    if (!name) return { name, desc: '' };

    let cleaned = name;
    let description = '';

    // 1. 층 정보 추출 (앞에 있는 N층)
    const floorMatch = cleaned.match(/^(\d층)\s*/);
    if (floorMatch) {
        description = floorMatch[1];
        cleaned = cleaned.replace(/^\d층\s*/, '');
    }

    // 2. 쉼표를 가운뎃점으로 (실 이름 사이)
    cleaned = cleaned.replace(/지혜실,복덕실/g, '지혜실·복덕실');
    cleaned = cleaned.replace(/효행실,안락실/g, '효행실·안락실');
    cleaned = cleaned.replace(/자비실,광명실/g, '자비실·광명실');
    cleaned = cleaned.replace(/칠보실,팔정도실/g, '칠보실·팔정도실');
    cleaned = cleaned.replace(/보은실,미타실/g, '보은실·미타실');

    // 3. 연속 쉼표 정리: 3,,4,5단 → 3~5단
    cleaned = cleaned.replace(/(\d+),,(\d+),(\d+)단/g, '$1~$3단');
    // 3,4,5단 → 3~5단
    cleaned = cleaned.replace(/(\d+),(\d+),(\d+)단/g, '$1~$3단');
    // 3,4,5,단 → 3~5단
    cleaned = cleaned.replace(/(\d+),(\d+),(\d+),단/g, '$1~$3단');

    // 4. 실과 단 사이 띄어쓰기
    cleaned = cleaned.replace(/([가-힣\)])(\d+단)/g, '$1 $2');
    cleaned = cleaned.replace(/([가-힣\)])(\d+~\d+단)/g, '$1 $2');

    // 5. 중복 공백 제거
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    return { name: cleaned, desc: description };
}

async function main() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });

    console.log('📖 시트 데이터 읽는 중...');
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    const rows = response.data.values || [];
    const header = rows[0];

    // 컬럼 인덱스 찾기
    const idCol = header.indexOf('시설ID');
    const nameCol = header.indexOf('상품명');
    const priceCol = header.indexOf('가격');
    const descCol = header.indexOf('설명');

    console.log(`컬럼 위치 - 시설ID: ${idCol}, 상품명: ${nameCol}, 가격: ${priceCol}, 설명: ${descCol}`);

    // ID 509 행들 찾기
    const id509Data = [];

    for (let i = 1; i < rows.length; i++) {
        if (rows[i][idCol] && rows[i][idCol].includes('509')) {
            id509Data.push([...rows[i]]);
        }
    }

    console.log(`\n📊 ID 509 행 수: ${id509Data.length}`);

    // 상품명 정리 및 설명 분리
    const seen = new Map();
    const cleanedRows = [];
    let duplicateCount = 0;

    for (const row of id509Data) {
        const originalName = row[nameCol] || '';
        const { name: cleanedName, desc } = cleanProductName(originalName);
        const price = row[priceCol] || '';
        const key = `${cleanedName}|${price}`;

        if (seen.has(key)) {
            duplicateCount++;
            continue;
        }

        seen.set(key, true);
        row[nameCol] = cleanedName;

        // 설명 컬럼에 층 정보 추가
        if (desc && descCol >= 0) {
            // 기존 설명이 있으면 합치기
            const existingDesc = row[descCol] || '';
            row[descCol] = existingDesc ? `${desc}, ${existingDesc}` : desc;
        }

        // 행 길이 맞추기
        while (row.length <= descCol) {
            row.push('');
        }
        if (desc && descCol >= 0) {
            row[descCol] = desc;
        }

        cleanedRows.push(row);

        if (originalName !== cleanedName || desc) {
            console.log(`  "${originalName}" → 상품명: "${cleanedName}", 설명: "${desc}"`);
        }
    }

    console.log(`\n✅ 정리 결과:`);
    console.log(`  - 원본 행 수: ${id509Data.length}`);
    console.log(`  - 중복 제거: ${duplicateCount}개`);
    console.log(`  - 최종 행 수: ${cleanedRows.length}`);

    // 시트에서 기존 509 데이터 제거 후 새로 추가
    const otherRows = rows.filter((row, i) => i === 0 || !row[idCol] || !row[idCol].includes('509'));
    const finalRows = [...otherRows, ...cleanedRows];

    console.log(`\n📝 시트 업데이트 중... (총 ${finalRows.length}행)`);

    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:Z`
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        resource: { values: finalRows }
    });

    console.log('\n✅ 완료! ID 509 데이터가 정리되었습니다.');

    // 샘플 출력
    console.log('\n📋 정리된 샘플 (처음 10개):');
    cleanedRows.slice(0, 10).forEach((row, i) => {
        console.log(`  ${i + 1}. 상품명: "${row[nameCol]}" | 설명: "${row[descCol] || ''}" | 가격: ${row[priceCol]}원`);
    });
}

main().catch(e => console.error('Error:', e.message));
