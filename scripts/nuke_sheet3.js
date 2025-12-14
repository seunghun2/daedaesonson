const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';
const TARGET_SHEET_TITLE = '시트3';

async function main() {
    console.log(`🗑️ Nuking ${TARGET_SHEET_TITLE}...`);

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    const sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    if (sheet) {
        await sheet.clear(); // Just clear content, keep the tab? Or delete? "다 지워줘" -> maybe delete tab.
        await sheet.delete();
        console.log("💥 Deleted.");
    } else {
        console.log("🤷 Already gone.");
    }
}

main().catch(console.error);
