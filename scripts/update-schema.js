const { google } = require('googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json'));

async function update() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 시설 유형 수정 - 봉안담 제거
    await sheets.spreadsheets.values.update({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '📋_스키마_정의!A8:E8',
        valueInputOption: 'RAW',
        resource: { values: [['facilityType', 'enum', 'O', '시설 유형', '봉안당 | 자연장지 | 화장시설 | 묘역시설']] }
    });

    // 시설 유형 목록 수정
    await sheets.spreadsheets.values.update({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '📋_스키마_정의!A49:C54',
        valueInputOption: 'RAW',
        resource: {
            values: [
                ['코드', '한글', '설명'],
                ['봉안당', '봉안당', '봉안 시설 (실내/야외 포함, 봉안담 통합)'],
                ['자연장지', '자연장지', '수목장, 잔디장 등'],
                ['화장시설', '화장시설', '화장장'],
                ['묘역시설', '묘역시설', '분묘, 매장묘'],
                ['', '', ''],
            ]
        }
    });

    console.log('스키마 업데이트 완료! 봉안담 → 봉안당 통합');
}
update();
