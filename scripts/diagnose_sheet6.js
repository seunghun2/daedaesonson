const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const TARGET_SHEET_TITLE = '시트6';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log("🔍 Diagnosing Sheet 6 Data (Top 10 Rows)...");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);

    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
        if (!sheet) {
            console.error("❌ Sheet 6 DOES NOT EXIST!");
            return;
        }

        await sheet.loadHeaderRow();
        console.log("headers:", sheet.headerValues);

        const rows = await sheet.getRows({ limit: 10 });
        if (rows.length === 0) {
            console.log("❌ Sheet is empty (no rows).");
            return;
        }

        rows.forEach((row, idx) => {
            console.log(`\nRow #${idx + 1} (ID: ${row.get('ID')})`);
            console.log(` - 시설명: ${row.get('시설명 (파일명)')}`);
            console.log(` - 항목(AI): ${row.get('항목 (Category)')}`);
            console.log(` - 내역(AI): ${row.get('내역 (Details)')}`);
            console.log(` - 요금(AI): ${row.get('요금 (Price)')}`);
            console.log(` - 주소(AI): ${row.get('주소 (AI)')}`);
        });

    } catch (e) {
        console.error("Diagnosis Error:", e);
    }
}

main();
