const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log("🔍 Diagnosing Sheet 1 Errors...");

    // Auth
    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['시트1']; // Assuming default title
    if (!sheet) { console.log("Sheet1 not found"); return; }

    const rows = await sheet.getRows();
    console.log(`Total Rows: ${rows.length}`);

    // 1. Check category0_1 for JSON
    let jsonCount = 0;
    const jsonSamples = [];
    rows.forEach((r, i) => {
        const val = r.get('category0_1');
        if (val && (val.trim().startsWith('{') || val.includes('"reason"'))) {
            jsonCount++;
            if (jsonSamples.length < 3) jsonSamples.push(`Row ${i + 2}: ${val.substring(0, 50)}...`);
        }
    });
    console.log(`\n🗑️ Rows with JSON in category0_1: ${jsonCount}`);
    if (jsonSamples.length > 0) console.log(jsonSamples.join('\n'));

    // 2. Check High Prices
    const priceRows = rows.map((r, i) => {
        let p = r.get('price');
        // Clean price string to number
        if (!p) return null;
        p = String(p).replace(/[^0-9]/g, '');
        const val = parseInt(p, 10);
        return { row: i + 2, val: val, text: p, raw: r.get('rawText') || "(No Raw Text)", name: r.get('parkName') || r.get('제목') };
    }).filter(x => x && !isNaN(x.val));

    // Sort by price desc
    priceRows.sort((a, b) => b.val - a.val);

    console.log(`\n💰 Top 10 Highest Prices:`);
    priceRows.slice(0, 10).forEach(x => {
        console.log(`Row ${x.row} [${x.name}]: ${x.val.toLocaleString()} 원`);
        // console.log(`   (Raw Text Check: ${x.raw.substring(0, 30)}...)`);
    });

}

main().catch(console.error);
