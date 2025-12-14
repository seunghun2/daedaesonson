const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log("🔍 Verifying Sheet 3 Data Integration...\n");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['시트3'];

    if (!sheet) { console.log("Sheet 3 missing!"); return; }

    const rows = await sheet.getRows();
    console.log(`✅ Total Rows: ${rows.length} (Should be 1498)`);

    // Check Random Samples
    console.log("\n--- Sample Facilities ---");
    const samples = [rows[0], rows[10], rows[100], rows[500]];

    samples.forEach((r, i) => {
        if (!r) return;
        console.log(`\n[${i + 1}] ${r.get('title')} (${r.get('address')})`);
        console.log(`   🏷️ Type: ${r.get('type')}`);
        console.log(`   🙏 Reli: ${r.get('religion')}`);
        console.log(`   🏢 Oper: ${r.get('operator')}`);
        console.log(`   ⚰️ Burial:  ${r.get('price_burial')}`);
        console.log(`   🏺 Charnel: ${r.get('price_charnel')}`);
        console.log(`   🌲 Natural: ${r.get('price_natural')}`);
    });

    // Stats
    const hasBurial = rows.filter(r => r.get('price_burial') !== '-').length;
    const hasCharnel = rows.filter(r => r.get('price_charnel') !== '-').length;
    const hasNatural = rows.filter(r => r.get('price_natural') !== '-').length;

    console.log(`\n📊 Pricing Coverage:`);
    console.log(`   - Burial:  ${hasBurial} facilities`);
    console.log(`   - Charnel: ${hasCharnel} facilities`);
    console.log(`   - Natural: ${hasNatural} facilities`);
}

main().catch(console.error);
