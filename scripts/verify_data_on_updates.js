const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';
const TARGET_SHEET_TITLE = 'data_on';

async function main() {
    console.log("🔍 Verifying 'data_on' Updates...");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    await sheet.loadCells('A2:F9500'); // Check first ~9500 rows

    let operCount = 0;
    let reliCount = 0;
    let total = 0;
    let sampleReli = [];

    // Columns: 3=Oper, 4=Reli (0-indexed)
    for (let r = 1; r < 9500; r++) {
        try {
            const name = sheet.getCell(r, 1).value;
            if (!name) continue; // Gap or end
            total++;

            const oper = sheet.getCell(r, 3).value;
            const reli = sheet.getCell(r, 4).value;

            if (oper && oper !== 'null' && oper !== '-') operCount++;
            if (reli && reli !== 'null' && reli !== '-') {
                reliCount++;
                if (sampleReli.length < 5) sampleReli.push(`${name}: ${reli}`);
            }
        } catch (e) { break; }
    }

    console.log(`\n📊 Stats for 'data_on':`);
    console.log(`   - Total Rows Checked: ${total}`);
    console.log(`   - 🏢 Operator Populated: ${operCount} (${Math.round(operCount / total * 100)}%)`);
    console.log(`   - 🙏 Religion Populated: ${reliCount} (${Math.round(reliCount / total * 100)}%)`);

    console.log(`\n🔎 Sample Religion Data:`);
    sampleReli.forEach(s => console.log(`   - ${s}`));
}

main().catch(console.error);
