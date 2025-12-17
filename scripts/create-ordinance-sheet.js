const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));

async function createOrdinanceSheet() {
    // 인증
    const auth = new google.auth.GoogleAuth({
        credentials: creds,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 1. 새 시트 생성
    const sheetName = '조례_가격_데이터';

    try {
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [{
                    addSheet: {
                        properties: { title: sheetName }
                    }
                }]
            }
        });
        console.log(`시트 생성: ${sheetName}`);
    } catch (e) {
        if (e.message.includes('already exists')) {
            console.log(`시트 이미 존재: ${sheetName}`);
        } else {
            throw e;
        }
    }

    // 2. 헤더 설정
    const headers = [
        ['지자체', '파일명', '시설유형', '구분', '거주구분', '사용기간', '사용료', '관리비', '합계', '비고']
    ];

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:J1`,
        valueInputOption: 'RAW',
        resource: { values: headers }
    });
    console.log('헤더 설정 완료');

    // 3. 파싱된 데이터 로드
    const parsedData = JSON.parse(fs.readFileSync('data/ordinance_hwp/parsed_all.json'));
    console.log(`파싱된 파일: ${parsedData.length}개`);

    // 4. 요약 데이터 생성 (각 지자체별 가격 개수)
    const summaryRows = parsedData.map(d => [
        d.region,
        d.file,
        '', // 시설유형 - 추후 파싱 필요
        '', // 구분
        '', // 거주구분
        '', // 사용기간
        d.prices.length > 0 ? d.prices[0] : '', // 첫 번째 가격
        d.prices.length > 1 ? d.prices[1] : '', // 두 번째 가격
        d.prices.length > 2 ? d.prices[2] : '', // 세 번째 가격
        `총 ${d.prices.length}개 가격, ${d.allTexts.length}개 텍스트`
    ]);

    if (summaryRows.length > 0) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `${sheetName}!A2:J${summaryRows.length + 1}`,
            valueInputOption: 'RAW',
            resource: { values: summaryRows }
        });
        console.log(`${summaryRows.length}행 데이터 추가 완료`);
    }

    console.log('\n완료! Google Sheet에서 확인하세요.');
}

createOrdinanceSheet().catch(console.error);
