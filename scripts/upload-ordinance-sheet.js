const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));

async function uploadStructuredData() {
    // 인증
    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const sheetName = '조례_가격_데이터';

    // 1. 기존 데이터 클리어
    try {
        await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A:J`
        });
        console.log('기존 데이터 클리어');
    } catch (e) {
        console.log('클리어 실패 (시트 없음?)');
    }

    // 2. 새 헤더 설정 (검증 컬럼 추가)
    const headers = [['지자체', '파일명', '시설유형', '구분', '거주구분', '사용기간', '사용료', '관리비', '합계', '검증', '비고']];

    // 3. 구조화된 데이터 로드
    const structuredData = JSON.parse(fs.readFileSync('data/ordinance_hwp/structured_prices.json'));
    console.log(`구조화된 데이터: ${structuredData.length}행`);

    // 4. 행 데이터 생성
    const rows = structuredData.map(d => [
        d.region,
        d.fileName,
        d.facilityType,
        d.category,
        d.residency,
        d.period,
        d.usageFee,
        d.managementFee,
        d.total,
        d.verified || (d.usageFee + d.managementFee === d.total ? 'O' : 'X'),
        '' // 비고
    ]);

    // 5. 헤더 + 데이터 업로드
    const allData = [...headers, ...rows];

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:K${allData.length}`,
        valueInputOption: 'RAW',
        resource: { values: allData }
    });

    console.log(`${rows.length}행 데이터 업로드 완료!`);
    console.log('\n=== 완료! Google Sheet 확인하세요 ===');
}

uploadStructuredData().catch(console.error);
