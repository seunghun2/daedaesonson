const { google } = require('googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json', 'utf8'));
const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

async function updatePublicStatus() {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    // 데이터 로드
    const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

    // facilities.json의 isPublic 필드를 기반으로 상태 맵 생성
    const statusMap = {};
    let publicCount = 0;
    let privateCount = 0;
    let unknownCount = 0;

    facilities.forEach(f => {
        if (f.isPublic === true) {
            statusMap[f.id] = '공설';
            publicCount++;
        } else if (f.isPublic === false) {
            statusMap[f.id] = '사설';
            privateCount++;
        } else {
            statusMap[f.id] = '미확인';
            unknownCount++;
        }
    });

    console.log('=== 상태 결정 완료 ===');
    console.log('공설:', publicCount, '개');
    console.log('사설:', privateCount, '개');
    console.log('미확인:', unknownCount, '개');

    // 시트 데이터 가져오기
    const res = await sheets.spreadsheets.values.get({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: '시트1!A:Z'
    });

    const rows = res.data.values;
    const header = rows[0];
    console.log('');
    console.log('현재 헤더:', header);

    // 운영구분 컬럼 인덱스 찾기
    let statusColIndex = header.indexOf('운영구분');

    if (statusColIndex === -1) {
        console.log('운영구분 컬럼 없음 - 추가함');
        statusColIndex = 3; // D열
    }

    // 운영구분 값만 업데이트
    const updates = [];
    for (let i = 1; i < rows.length; i++) {
        const parkId = rows[i][0];
        const status = statusMap[parkId] || '미확인';
        updates.push([status]);
    }

    // D열만 업데이트 (헤더 제외)
    await sheets.spreadsheets.values.update({
        spreadsheetId: '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY',
        range: `시트1!D2:D${rows.length}`,
        valueInputOption: 'RAW',
        resource: { values: updates }
    });

    console.log('');
    console.log('✅ 운영구분 컬럼 업데이트 완료!');
    console.log(`총 ${updates.length}개 행 업데이트`);
}

updatePublicStatus();
