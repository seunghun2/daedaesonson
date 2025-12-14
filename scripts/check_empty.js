const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const TARGET_SHEET_TITLE = '시트1';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log("🔍 Checking for empty 'ai_headline' cells...");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    await sheet.loadHeaderRow();

    const rows = await sheet.getRows();
    let emptyCount = 0;

    console.log(`📋 Total Rows: ${rows.length}`);

    rows.forEach((row, index) => {
        const headline = row.get('ai_headline');
        if (!headline || headline.trim() === '') {
            emptyCount++;
            // Optional: Print first few empty row numbers
            if (emptyCount <= 5) console.log(`   🔸 Empty Row #${index + 2} (Index: ${index}) - Title: ${row.get('제목')}`);
        }
    });

    console.log(`\n📊 Final Result:`);
    console.log(`   ✅ Filled: ${rows.length - emptyCount}`);
    console.log(`   ❌ Empty:  ${emptyCount} (${((emptyCount / rows.length) * 100).toFixed(2)}%)`);

    if (emptyCount === 0) {
        console.log("\n🎉 CONGRATULATIONS! ALL CLEAN! 🎉");
    }
}

main().catch(console.error);
