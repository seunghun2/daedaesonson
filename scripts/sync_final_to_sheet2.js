const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// --- CONFIG ---
const SHEET_ID = '1de1ZjYEp7E8rSnwGmCJjcXWfCFZ5GyBP_NZcnA7lOko';
const TARGET_SHEET_TITLE = '시트2';
const SOURCE_FILE = 'data/pricing_class_final.json'; // The requested file
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log(`🚀 Loading "${SOURCE_FILE}" to sync...`);

    // 1. Load Data
    if (!fs.existsSync(SOURCE_FILE)) {
        console.error('❌ Source file not found!');
        return;
    }
    const data = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
    console.log(`📊 Loaded ${data.length} items.`);

    // 2. Auth
    if (!fs.existsSync(CREDENTIALS_PATH)) {
        console.error('❌ Credentials file not found!');
        return;
    }
    const creds = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const serviceAccountAuth = new JWT({
        email: creds.client_email,
        key: creds.private_key,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();
    console.log(`✅ Connected to Document: ${doc.title}`);

    // 3. Prepare Sheet
    let sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    if (!sheet) {
        console.log(`✨ Creating Sheet "${TARGET_SHEET_TITLE}"...`);
        sheet = await doc.addSheet({ title: TARGET_SHEET_TITLE });
    } else {
        console.log(`🧹 Clearing Sheet "${TARGET_SHEET_TITLE}"...`);
        await sheet.clear();
    }

    // 4. Determine Headers (Dynamic)
    if (data.length === 0) {
        console.log('⚠️ No data to upload.');
        return;
    }

    // Make sure we capture ALL unique keys from the dataset
    const allKeys = new Set();
    data.forEach(item => Object.keys(item).forEach(k => allKeys.add(k)));
    const headers = Array.from(allKeys);

    console.log('📝 Headers:', headers);
    await sheet.setHeaderRow(headers);

    // 5. Upload
    console.log('📤 Uploading...');
    const BATCH_SIZE = 500;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const chunk = data.slice(i, i + BATCH_SIZE);
        // Map raw data directly
        const rows = chunk.map(item => {
            const row = {};
            headers.forEach(h => {
                // Determine value (convert objects/arrays to string if needed)
                let val = item[h];
                if (typeof val === 'object' && val !== null) val = JSON.stringify(val);
                if (val === undefined || val === null) val = '';
                row[h] = val;
            });
            return row;
        });

        await sheet.addRows(rows);
        console.log(`   Processed ${Math.min(i + BATCH_SIZE, data.length)} / ${data.length}...`);
    }

    console.log('✨ Done!');
}

main().catch(console.error);
