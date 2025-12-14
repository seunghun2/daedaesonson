const fs = require('fs');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const path = require('path');

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const CREDENTIALS_PATH = 'credentials.json';
const API_KEY = "AIzaSyD2qMR8nAEhxZNzbFhJPIz1EgUfNb8pdwE";

const PRICE_THRESHOLD = 500000000; // 5억 이상은 의심 (500 million KRW)

async function analyzePrice(model, rawText, itemName) {
    if (!rawText || rawText.length < 5) return "0";

    // Simple heuristic first: look for patterns like "1,000,000"
    // But AI is safer for "23842003170000" cases.

    const prompt = `
Task: Extract a SINGLE Reasonable Price from this messy text.
Context: Cemetery/Charnel house pricing.
Input Text: "${rawText}"
Item Name: "${itemName}"

Likely formatting error: Multiple numbers might be concatenated (e.g. 20000003000000 -> 2,000,000 & 3,000,000).
Goal: Find the *primary* price for this item. If range, take the lowest.
If unsure or no price found, return 0.

Output ONLY the number (Integer, no commas).
`;
    try {
        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/[^0-9]/g, '');
        return text || "0";
    } catch (e) {
        return "0";
    }
}

async function main() {
    console.log("🚀 Starting Sheet 1 Repairs...");

    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle['시트1'];

    const rows = await sheet.getRows();
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let fixedCount = 0;
    let jsonFixed = 0;

    // Batch Process
    const UPDATES = [];

    console.log(`Scanning ${rows.length} rows...`);

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        let changed = false;

        // 1. Fix JSON in category0_1
        const cat0_1 = row.get('category0_1');
        if (cat0_1 && (cat0_1.trim().startsWith('{') || cat0_1.includes('```json') || cat0_1.includes('"reason"'))) {
            row.set('category0_1', '정보없음');
            jsonFixed++;
            changed = true;
        }

        // 2. Fix High Prices
        let priceStr = String(row.get('price')).replace(/[^0-9]/g, '');
        const priceVal = parseInt(priceStr, 10);

        if (!isNaN(priceVal) && priceVal > PRICE_THRESHOLD) {
            process.stdout.write(`\n💰 Fixing Row ${i + 2} [${row.get('parkName')}]: ${priceVal} -> `);
            const rawText = row.get('rawText') || row.get('제목') || ""; // Use RawText if available

            // AI Re-analysis
            const newPrice = await analyzePrice(model, rawText, row.get('parkName'));
            process.stdout.write(`${newPrice}`);

            row.set('price', newPrice);
            fixedCount++;
            changed = true;

            // Artificial delay to avoid rate limits
            await new Promise(r => setTimeout(r, 200));
        }

        if (changed) {
            UPDATES.push(row);
        }
    }

    // Save batches
    if (UPDATES.length > 0) {
        console.log(`\n\n💾 Saving ${UPDATES.length} updates...`);
        for (let i = 0; i < UPDATES.length; i += 50) {
            const batch = UPDATES.slice(i, i + 50);
            await Promise.all(batch.map(r => r.save()));
            process.stdout.write('.');
        }
    }

    console.log(`\n🎉 Done! Fixed ${jsonFixed} JSON fields and ${fixedCount} Price errors.`);
}

main().catch(console.error);
