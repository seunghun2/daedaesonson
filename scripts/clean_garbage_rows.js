const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';
const TARGET_SHEET_TITLE = 'data_on';

async function main() {
    console.log("🧹 Starting Garbage Removal from 'data_on'...");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    const rows = await sheet.getRows({ limit: 15000 }); // Fetch all rows
    console.log(`📥 Loaded ${rows.length} rows.`);

    const rowsToDelete = [];
    const keywords = ['한국장례문화진흥원', '보건복지부', 'TEL :', 'FAX :', '인농빌딩'];

    for (const row of rows) {
        const kVal = (row.get('제목') || "").toString(); // Using header name '제목' (Col K)
        const lVal = (row.get('설명') || "").toString(); // Using header name '설명' (Col L)

        // Also check raw values if header access fails? 
        // No, '제목' and '설명' are correct headers from previous inspection.

        const combined = kVal + " " + lVal;

        if (keywords.some(kw => combined.includes(kw))) {
            rowsToDelete.push(row);
        }
    }

    if (rowsToDelete.length === 0) {
        console.log("✨ No garbage found.");
        return;
    }

    console.log(`🗑️ Found ${rowsToDelete.length} garbage rows. Deleting...`);

    // Delete in sequence (async)
    let deleted = 0;
    for (const row of rowsToDelete) {
        process.stdout.write(`\rDeleting row ${row.rowIndex}... (${++deleted}/${rowsToDelete.length})`);
        try {
            await row.delete();
            // await new Promise(res => setTimeout(res, 100)); // Rate limit
        } catch (e) {
            console.log(`\nFailed to delete row ${row.rowIndex}: ${e.message}`);
        }
    }
    console.log("\n🎉 Cleanup Complete!");
}

main().catch(console.error);
