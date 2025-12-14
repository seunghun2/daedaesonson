const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';
const SOURCE_TITLE = '시트1';
const BACKUP_TITLE = '시트1_복사본';

async function main() {
    console.log(`📦 Backing up ${SOURCE_TITLE}...`);

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    const sourceSheet = doc.sheetsByTitle[SOURCE_TITLE];
    if (!sourceSheet) {
        console.error("❌ Source sheet not found!");
        return;
    }

    // Check if backup exists, delete if so
    const existingBackup = doc.sheetsByTitle[BACKUP_TITLE];
    if (existingBackup) {
        console.log(`🗑️ Deleting old backup...`);
        await existingBackup.delete();
    }

    // Duplicate
    console.log(`✨ Duplicating to ${BACKUP_TITLE}...`);
    // Note: google-spreadsheet doesn't have a direct 'copyTo' method easily exposed for cross-sheet? 
    // Actually it does: sheet.copyToSpreadsheet(sheetId) but that's for other docs.
    // Efficient way: copyToSpreadsheet(doc.sheetId)? Or just read/write.
    // Let's rely on copyToSpreadsheet within same doc if supported, or read/write.

    // Attempting read/write for safety and explicit control
    const rows = await sourceSheet.getRows();
    const headerValues = sourceSheet.headerValues;

    const backupSheet = await doc.addSheet({
        title: BACKUP_TITLE,
        headerValues: headerValues
    });

    // Batch add
    const BATCH = 1000;
    const rawRows = rows.map(r => {
        const rowObj = {};
        headerValues.forEach(h => rowObj[h] = r.get(h));
        return rowObj;
    });

    console.log(`💾 Writing ${rawRows.length} rows to backup...`);
    for (let i = 0; i < rawRows.length; i += BATCH) {
        await backupSheet.addRows(rawRows.slice(i, i + BATCH));
        process.stdout.write('.');
    }
    console.log("\n✅ Backup Complete!");
}

main().catch(console.error);
