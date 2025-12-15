const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// --- CONFIG ---
const SHEET_ID = '1de1ZjYEp7E8rSnwGmCJjcXWfCFZ5GyBP_NZcnA7lOko';
const TARGET_SHEET_TITLE = '시트2'; // Target Sheet Name
const DB_PATH = 'data/pricing_db.json';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log(`🚀 Starting Sync to "${TARGET_SHEET_TITLE}"...`);

    // 1. Load Data
    if (!fs.existsSync(DB_PATH)) {
        console.error('❌ Database file not found!');
        return;
    }
    const data = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
    console.log(`📊 Loaded ${data.length} items from DB.`);

    // 2. Auth with Google
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

    try {
        await doc.loadInfo();
        console.log(`✅ Connected to Document: ${doc.title}`);
    } catch (e) {
        console.error('❌ Connection failed.');
        console.error(e);
        return;
    }

    // 3. Find or Create Target Sheet
    let sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    if (!sheet) {
        console.log(`✨ Sheet "${TARGET_SHEET_TITLE}" not found. Creating it...`);
        sheet = await doc.addSheet({ title: TARGET_SHEET_TITLE });
    } else {
        console.log(`found Sheet "${TARGET_SHEET_TITLE}". Cleaning it up...`);
        await sheet.clear();
    }

    // Define Headers
    const headers = [
        'id', 'parkId', 'parkName', 'institutionType',
        'category0', 'category1', 'category2', 'category3',
        'itemName1', 'itemName2', 'rawText', 'price'
    ];

    await sheet.setHeaderRow(headers);

    // 4. Push Data
    console.log('📤 Uploading data to Sheet 2...');

    const BATCH_SIZE = 500;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const chunk = data.slice(i, i + BATCH_SIZE);
        const rows = chunk.map(item => ({
            id: item.id,
            parkId: item.parkId,
            parkName: item.parkName,
            institutionType: item.institutionType,
            category0: item.category0 || '',
            category1: item.category1 || '',
            category2: item.category2 || '',
            category3: item.category3 || '',
            itemName1: item.itemName1 || '',
            itemName2: item.itemName2 || '',
            rawText: item.rawText || '',
            price: item.price
        }));

        await sheet.addRows(rows);
        console.log(`   Processed ${Math.min(i + BATCH_SIZE, data.length)} / ${data.length} rows...`);
    }

    console.log('✨ Sync to Sheet 2 Complete!');
    console.log(`🔗 Link: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
}

main().catch(console.error);
