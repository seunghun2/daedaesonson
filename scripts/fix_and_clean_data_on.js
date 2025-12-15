const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';
const TARGET_SHEET_TITLE = 'data_on';

async function main() {
    console.log("🛠️ Starting Fix & Clean for 'data_on'...");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];

    // 1. Fix Duplicate Headers
    console.log("🔧 Checking Headers for duplicates...");
    // Load first row cells (Assuming standard headers A1:Z1)
    await sheet.loadCells('A1:M1');

    // Check known duplicates? We saw '운영' at Col 3 (D) and Col 7 (H)
    // Indexes: 0..12
    const headers = [];
    const duplicates = [];
    for (let c = 0; c < 13; c++) {
        const val = sheet.getCell(0, c).value;
        if (val) {
            if (headers.includes(val)) duplicates.push({ val, col: c });
            headers.push(val);
        }
    }

    if (duplicates.length > 0) {
        console.log(`🚨 Found ${duplicates.length} duplicates. Fixing...`);
        let madeChange = false;

        // HACK: Rename duplicates manually
        // We know Col 7 (H) was the secondary "운영". Let's name it '운영_구' (Old)
        const cellH = sheet.getCell(0, 7); // H is index 7
        if (cellH.value === '운영') {
            cellH.value = '운영_old';
            madeChange = true;
            console.log("   -> Renamed H1 '운영' to '운영_old'");
        }

        if (madeChange) {
            await sheet.saveUpdatedCells();
            console.log("✅ Headers updated.");
        }
    } else {
        console.log("✅ No duplicates found in first check.");
    }

    // 2. Now Safe to use getRows()
    console.log("📥 Loading Rows for Cleanup...");
    // Force reload of header row in internal cache if possible, or just calling getRows might refresh?
    // doc.loadInfo() might need to refresh? 
    // GoogleSpreadsheet caches headerValues. 
    await sheet.loadHeaderRow(); // Reload headers explicitly

    const rows = await sheet.getRows({ limit: 15000 });
    console.log(`📋 Scanned ${rows.length} rows.`);

    const rowsToDelete = [];
    const keywords = ['한국장례문화진흥원', '보건복지부', 'TEL :', 'FAX :', '인농빌딩'];

    for (const row of rows) {
        const kVal = (row.get('제목') || "").toString();
        const lVal = (row.get('설명') || "").toString();
        const combined = kVal + " " + lVal;

        if (keywords.some(kw => combined.includes(kw))) {
            rowsToDelete.push(row);
        }
    }

    if (rowsToDelete.length === 0) {
        console.log("✨ No garbage rows found.");
    } else {
        console.log(`🗑️ Found ${rowsToDelete.length} garbage rows. Deleting...`);
        let deleted = 0;
        for (const row of rowsToDelete) {
            process.stdout.write(`\rDeleting row ${row.rowIndex}... (${++deleted}/${rowsToDelete.length})`);
            try {
                await row.delete();
            } catch (e) {
                console.log(`\nFailed to delete row ${row.rowIndex}: ${e.message}`);
            }
        }
        console.log("\n🎉 Cleanup Complete!");
    }
}

main().catch(console.error);
