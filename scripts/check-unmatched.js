const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';
const creds = JSON.parse(fs.readFileSync('data/구글 api/sonson-481412-0514ba9d773f.json'));
const facilities = JSON.parse(fs.readFileSync('data/facilities.json'));

async function check() {
    const auth = new google.auth.GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    const sheet1Data = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: '시트1!A:A'
    });

    const sheet1IDs = new Set(sheet1Data.data.values.flat().filter(id => id && id.startsWith('park-')));
    const privateIDs = facilities.filter(f => f.isPublic === false).map(f => f.id);

    console.log('시트1 ID 수:', sheet1IDs.size);
    console.log('사설 ID 수:', privateIDs.length);

    const notInSheet1 = privateIDs.filter(id => !sheet1IDs.has(id));
    console.log('시트1에 없는 ID:', notInSheet1.length);

    if (notInSheet1.length > 0) {
        console.log('\n처음 10개:');
        notInSheet1.slice(0, 10).forEach(id => {
            const f = facilities.find(x => x.id === id);
            console.log(id, f.name);
        });
    }
}
check();
