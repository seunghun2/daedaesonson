const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configuration
const CREDENTIALS_PATH = path.join(__dirname, '../data/구글 api/sonson-481412-0514ba9d773f.json');
const SPREADSHEET_ID = '1FkeYv-T5eL0oRR4EYNq8LwwP3NaXFxClZaCX7b_hnRY';

async function getAuthClient() {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    return auth.getClient();
}

async function getSheets() {
    const auth = await getAuthClient();
    return google.sheets({ version: 'v4', auth });
}

// Read data from sheet
async function readSheet(range = 'Sheet1!A1:G100') {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range
    });
    return response.data.values;
}

// Write data to sheet
async function writeSheet(range, values) {
    const sheets = await getSheets();
    const response = await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range,
        valueInputOption: 'RAW',
        resource: { values }
    });
    return response.data;
}

// Update specific cell
async function updateCell(row, col, value) {
    const colLetter = String.fromCharCode(64 + col); // 1=A, 2=B, etc.
    const range = `Sheet1!${colLetter}${row}`;
    return await writeSheet(range, [[value]]);
}

// Find and update cell by content
async function findAndUpdate(searchCol, searchValue, updateCol, newValue) {
    const data = await readSheet('Sheet1!A:G');
    for (let i = 0; i < data.length; i++) {
        if (data[i][searchCol - 1] === searchValue) {
            await updateCell(i + 1, updateCol, newValue);
            return { row: i + 1, updated: true };
        }
    }
    return { updated: false };
}

// Refresh entire sheet with API data
async function refreshFromAPI() {
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
        'https://jbydmhfuqnpukfutvrgs.supabase.co',
        'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'
    );

    // Get categories
    let allCats = [];
    let page = 0;
    while (true) {
        const { data } = await supabase.from('PriceCategory').select('id, name').range(page * 1000, (page + 1) * 1000 - 1);
        if (!data || data.length === 0) break;
        allCats = allCats.concat(data);
        if (data.length < 1000) break;
        page++;
    }
    const catMap = {};
    allCats.forEach(c => catMap[c.id] = c.name);

    // Get facilities
    const { data: facilities } = await supabase.from('Facility').select('id, name');
    const nameMap = {};
    (facilities || []).forEach(f => nameMap[f.id] = f.name);

    // Get price items
    let allItems = [];
    page = 0;
    while (true) {
        const { data } = await supabase.from('PriceItem')
            .select('facilityId, categoryId, itemName, description, price, isRepresentative')
            .order('facilityId')
            .range(page * 1000, (page + 1) * 1000 - 1);
        if (!data || data.length === 0) break;
        allItems = allItems.concat(data);
        if (data.length < 1000) break;
        page++;
    }

    // Build rows
    const rows = [['시설ID', '시설명', '가격카테고리', '상품명', '설명', '가격', '대표가격']];
    allItems.forEach(item => {
        rows.push([
            item.facilityId,
            nameMap[item.facilityId] || '',
            catMap[item.categoryId] || '미분류',
            item.itemName || '',
            item.description || '',
            item.price || 0,
            item.isRepresentative ? 'Y' : ''
        ]);
    });

    // Clear and write
    const sheets = await getSheets();
    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1'
    });

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Sheet1!A1',
        valueInputOption: 'RAW',
        resource: { values: rows }
    });

    console.log(`✅ Refreshed! ${rows.length - 1} items`);
    return rows.length - 1;
}

// Test connection
async function test() {
    try {
        const data = await readSheet('Sheet1!A1:G5');
        console.log('✅ Connection successful!');
        console.log('First 5 rows:', data);
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

module.exports = { readSheet, writeSheet, updateCell, findAndUpdate, refreshFromAPI, test };

// Run if called directly
if (require.main === module) {
    const action = process.argv[2];
    if (action === 'test') {
        test();
    } else if (action === 'refresh') {
        refreshFromAPI();
    } else {
        console.log('Usage: node google-sheets.js [test|refresh]');
    }
}
