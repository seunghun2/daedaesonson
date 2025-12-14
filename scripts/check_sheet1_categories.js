const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log("🔍 Checking Sheet 1 Categories...\n");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['시트1'];

    if (!sheet) {
        console.log("Sheet 1 not found");
        return;
    }

    const rows = await sheet.getRows();
    console.log(`Total rows: ${rows.length}\n`);

    // Find rows with non-empty category values
    const samples = {
        category0: [],
        category0_1: [],
        category1: [],
        category2: [],
        category3: []
    };

    for (const row of rows) {
        for (const key of Object.keys(samples)) {
            const val = row.get(key);
            if (val && val.trim() && samples[key].length < 5) {
                samples[key].push({
                    facility: row.get('parkName') || row.get('제목') || '(이름없음)',
                    value: val
                });
            }
        }
    }

    // Display samples
    for (const [key, items] of Object.entries(samples)) {
        console.log(`\n=== ${key} ===`);
        if (items.length === 0) {
            console.log("  (No data found)");
        } else {
            items.forEach((item, i) => {
                console.log(`  ${i + 1}. [${item.facility}]`);
                console.log(`     "${item.value}"`);
            });
        }
    }
}

main().catch(console.error);
