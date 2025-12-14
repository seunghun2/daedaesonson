const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// --- CONFIG ---
const SHEET_ID = '1de1ZjYEp7E8rSnwGmCJjcXWfCFZ5GyBP_NZcnA7lOko'; // User provided ID
const DB_PATH = 'data/pricing_db.json';
const CREDENTIALS_PATH = 'credentials.json';

async function main() {
    console.log('🚀 Starting Google Sheet Sync...');

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
        console.log(`✅ Connected to Sheet: ${doc.title}`);
    } catch (e) {
        console.error('❌ Failed to connect to Google Sheet. Did you share the sheet with the bot email?', creds.client_email);
        console.error(e);
        return;
    }

    // 3. Prepare Sheet
    let sheet = doc.sheetsByIndex[0]; // First sheet

    // Define Headers
    const headers = [
        'id', 'parkId', 'parkName', 'institutionType',
        'category0', 'category1', 'category2', 'category3',
        'itemName1', 'itemName2', 'rawText', 'price'
    ];

    console.log('🧹 Clearing old data...');
    await sheet.clear(); // Clear everything

    console.log('📝 Setting headers...');
    await sheet.setHeaderRow(headers);

    // 4. Push Data (Batching to avoid timeouts)
    console.log('📤 Uploading data... (This may take a moment)');

    const BATCH_SIZE = 500;
    for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const chunk = data.slice(i, i + BATCH_SIZE);
        // Map data to match headers
        const rows = chunk.map(item => ({
            id: item.id,
            parkId: item.parkId,
            parkName: item.parkName,
            institutionType: item.institutionType,
            category0: item.category0,
            category1: item.category1,
            category2: item.category2,
            category3: item.category3,
            itemName1: item.itemName1,
            itemName2: item.itemName2,
            rawText: item.rawText,
            price: item.price
        }));

        await sheet.addRows(rows);
        console.log(`   Processed ${Math.min(i + BATCH_SIZE, data.length)} / ${data.length} rows...`);
    }

    console.log('✨ Synchronization Complete!');
    console.log(`🔗 Link: https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit`);
}

main().catch(console.error);
