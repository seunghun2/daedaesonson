const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);

    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByTitle['data_on'];
        const rows = await sheet.getRows({ limit: 500 }); // Check first 500 rows

        console.log("--- Inspecting ID 1 ---");

        let found = 0;
        for (const row of rows) {
            // Check 'parKId' (Col 2, index C) or 'id' (Col 0)?
            // Visual check showed 'parkId' at index 2 (C), 'id' at index 0 (A).
            // Usually 'parkId' or 'id' matches '1'.
            const id = row.get('id');
            const parkId = row.get('parkId');
            const name = row.get('시설명');

            if (id === '1' || parkId === '1' || (name && name.includes('낙원추모공원'))) {
                console.log(`\n[Row ${row.rowIndex}]`);
                console.log(`   - Title (K): ${row.get('제목')}`);
                console.log(`   - Desc  (L): ${row.get('설명')}`);
                console.log(`   - Tags  (F): ${row.get('필터')}`);
                found++;
            }
        }
        console.log(`\nFound ${found} rows.`);

    } catch (e) {
        console.error(e);
    }
}

main();
