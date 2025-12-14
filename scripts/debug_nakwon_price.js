const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log("🔍 Inspecting '낙원추모공원' in Sheet 1...\n");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet1 = doc.sheetsByTitle['시트1'];

    const rows = await sheet1.getRows();
    const target = rows.filter(r => (r.get('parkName') || r.get('제목') || "").includes('낙원추모공원'));

    console.log(`Found ${target.length} rows for Nakwon.\n`);

    target.forEach((r, i) => {
        const raw = r.get('price');
        const text = r.get('rawText') || "";
        const cat = r.get('category0') || "";

        // Only show suspicious low prices
        const val = parseInt(String(raw).replace(/[^0-9]/g, ''), 10);
        if (val < 1000000) { // Less than 1 million
            console.log(`[Row ${i + 1}] Price: ${raw} (Parsed: ${val})`);
            console.log(`   Text: ${text.substring(0, 50)}...`);
            console.log(`   Cat:  ${cat}`);
            console.log('---');
        }
    });

}

main().catch(console.error);
