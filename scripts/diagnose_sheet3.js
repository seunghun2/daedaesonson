const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log("🔍 Diagnosing Sheet 3 (Merged)...");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    
    const sheet = doc.sheetsByTitle['시트3'];
    if(!sheet) { console.log("Sheet 3 not found"); return; }
    
    const rows = await sheet.getRows();
    console.log(`Total Rows: ${rows.length}`);
    
    // 1. Check a few random rows
    console.log("\n--- [Random Rows] ---");
    for(let i=0; i<3; i++) {
        const r = rows[i];
        console.log(`Row ${i} (${r.get('parkName')}): Addr=[${r.get('address')}] Phone=[${r.get('phone')}] Matches=[${r.get('is_reference_match')}]`);
    }

    // 2. Check MATCHED rows
    console.log("\n--- [Matched Rows] ---");
    const matched = rows.filter(r => r.get('is_reference_match') === 'O').slice(0, 3);
    matched.forEach(r => {
        console.log(`MATCHED (${r.get('parkName')}):`);
        console.log(`   Tags: ${r.get('tags')}`);
        console.log(`   Price Details: ${r.get('price_details').substring(0, 50)}...`);
        console.log(`   Img: ${r.get('image_url') ? 'Yes' : 'No'}`);
    });

}

main().catch(console.error);
