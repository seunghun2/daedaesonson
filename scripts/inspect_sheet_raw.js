const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);

    await doc.loadInfo();
    console.log(`Title: ${doc.title}`);

    // Check Sheet 6
    const sheet = doc.sheetsByTitle['시트6'];
    if (!sheet) {
        console.log("❌ '시트6' not found!");
        return;
    }

    console.log(`Found '시트6'. Loading Top 5 Rows Raw...`);
    await sheet.loadCells('A1:L5'); // Load range

    for (let r = 0; r < 5; r++) {
        let rowData = [];
        for (let c = 0; c < 12; c++) {
            const cell = sheet.getCell(r, c);
            rowData.push(`[${cell.value}]`);
        }
        console.log(`R${r + 1}: ${rowData.join(' ')}`);
    }
}

main();
