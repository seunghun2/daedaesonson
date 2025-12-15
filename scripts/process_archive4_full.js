const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Configuration
const SUPABASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const BUCKET_NAME = 'facilities'; // Use existing bucket

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const TARGET_SHEET_TITLE = '시트6';
const CREDENTIALS_PATH = 'credentials.json';
const API_KEY = "AIzaSyD2qMR8nAEhxZNzbFhJPIz1EgUfNb8pdwE";
const ARCHIVE_DIR = 'archive4';
const CONCURRENCY = 5;

// Initialize Clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Headers for Sheet
const HEADERS = [
    'ID', '시설명 (파일명)', '이미지 URL',
    '유형 (AI)', '종교 (AI)', '운영 (AI)', '주소 (AI)', '전화 (AI)',
    '항목 (Category)', '내역 (Details)', '요금 (Price)'
];

async function uploadImage(filePath, fileName) {
    try {
        const fileBuffer = fs.readFileSync(filePath);
        // Rename to clean English ID-based name
        const id = fileName.split('.')[0];
        const safeName = `${id}_pricing.png`;

        const { data, error } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(safeName, fileBuffer, {
                contentType: 'image/png',
                upsert: true
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(safeName);

        return publicUrl;
    } catch (e) {
        console.error(`   ❌ Upload Failed (${fileName}): ${e.message}`);
        return null;
    }
}

async function analyzeImage(filePath) {
    try {
        const fileData = fs.readFileSync(filePath);
        const prompt = `
Task: Analyze cemetery pricing table image.
STRICT RULE: EXTRACT ONLY TEXT VISIBLE IN THE IMAGE. 
If address/phone missing, return empty string "". 
DO NOT output "tag only" or "visible only".

Output JSON:
{
  "info": {
    "type": "", 
    "religion": "", 
    "operation": "", 
    "address": "", 
    "phone": ""
  },
  "prices": [
    { "category": "...", "details": "...", "price": "..." }
  ]
}
`;
        const result = await model.generateContent([
            { inlineData: { data: fileData.toString("base64"), mimeType: 'image/png' } },
            prompt
        ]);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(text);
    } catch (e) {
        return null;
    }
}

async function main() {
    console.log("🚀 STARTING FULL ARCHIVE PROCESSING (RETRY)...");

    // 1. Prepare Sheet
    const credspath = path.resolve(process.cwd(), CREDENTIALS_PATH);
    const creds = JSON.parse(fs.readFileSync(credspath, 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    let sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    if (!sheet) {
        sheet = await doc.addSheet({ title: TARGET_SHEET_TITLE, headerValues: HEADERS });
    } else {
        try { await sheet.loadHeaderRow(); }
        catch (e) { await sheet.setHeaderRow(HEADERS); }
        // Clear previous data to avoid duplicates/confusion
        console.log("Cleaning sheet...");
        await sheet.clearRows();
    }

    // 2. Scan Files
    const files = fs.readdirSync(ARCHIVE_DIR).filter(f => f.endsWith('.png'));
    console.log(`📋 Total Files: ${files.length}`);
    files.sort((a, b) => parseInt(a) - parseInt(b));

    // 3. Process Batch
    for (let i = 0; i < files.length; i += CONCURRENCY) {
        const chunk = files.slice(i, i + CONCURRENCY);
        console.log(`\n⚡️ Processing Chunk ${i} (IDs: ${chunk[0].split('.')[0]}...)`);

        const promises = chunk.map(async (file) => {
            const filePath = path.join(ARCHIVE_DIR, file);
            const id = file.split('.')[0];
            const name = file.replace(`${id}.`, '').replace('.png', '').replace(/_/g, ' ');

            // A. Upload
            const publicUrl = await uploadImage(filePath, file); // Now Korean Safe
            if (!publicUrl) return null;

            // B. AI Analyze
            const aiData = await analyzeImage(filePath);
            if (!aiData) return null;

            // C. Prepare Rows (Fix Newlines)
            const rowsToAdd = [];
            const info = aiData.info || {};
            const clean = (s) => s ? String(s).replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : "";

            const prices = aiData.prices || [];

            if (!prices || prices.length === 0) {
                rowsToAdd.push({
                    'ID': id, '시설명 (파일명)': clean(name), '이미지 URL': publicUrl,
                    '유형 (AI)': clean(info.type), '종교 (AI)': clean(info.religion), '운영 (AI)': clean(info.operation),
                    '주소 (AI)': clean(info.address), '전화 (AI)': clean(info.phone),
                    '항목 (Category)': '가격표 없음', '내역 (Details)': '-', '요금 (Price)': '-'
                });
            } else {
                prices.forEach(p => {
                    rowsToAdd.push({
                        'ID': id, '시설명 (파일명)': clean(name), '이미지 URL': publicUrl,
                        '유형 (AI)': clean(info.type), '종교 (AI)': clean(info.religion), '운영 (AI)': clean(info.operation),
                        '주소 (AI)': clean(info.address), '전화 (AI)': clean(info.phone),
                        '항목 (Category)': clean(p.category), '내역 (Details)': clean(p.details), '요금 (Price)': clean(p.price)
                    });
                });
            }
            return rowsToAdd;
        });

        const results = await Promise.all(promises);
        const flattenedRows = results.flat().filter(r => r);

        if (flattenedRows.length > 0) {
            try {
                await sheet.addRows(flattenedRows);
                process.stdout.write(`   ✅ Added ${flattenedRows.length} rows.`);
            } catch (e) {
                console.log(`   ⚠️ Sheet Save Error: ${e.message}`);
            }
        }

        await new Promise(r => setTimeout(r, 1000));
    }
    console.log("🏁 All Files Processed!");
}

main().catch(console.error);
