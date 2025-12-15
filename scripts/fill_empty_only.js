const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const TARGET_SHEET_TITLE = '시트1';
const CREDENTIALS_PATH = 'credentials.json';
const API_KEY = "AIzaSyD2qMR8nAEhxZNzbFhJPIz1EgUfNb8pdwE";
const CONCURRENCY = 30; // 30 Concurrent Requests

function normalizeText(text) {
    if (!text) return "";
    return text.replace(/[\s,0-9]+원?$/, '').trim();
}

async function analyzeItem(model, text) {
    const prompt = `
Task: Extract 'headline' (Product Name) and 'support' (Details).
Input: "${text}"
Rules: 1. Headline: Core product name. 2. Support: Details. 3. REMOVE PRICES.
Output JSON: { "headline": "...", "support": "..." }
`;
    try {
        const result = await model.generateContent(prompt);
        const txt = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(txt);
    } catch (e) {
        return { headline: "", support: "" };
    }
}

async function main() {
    console.log("🚀 STARTING EMPTY ROW ATTACK (gemini-2.0-flash)...");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();
    const sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    await sheet.loadHeaderRow();
    const rows = await sheet.getRows();

    // 1. Filter ONLY Empty Rows
    const emptyRows = rows.filter(r => !r.get('ai_headline') || r.get('ai_headline').trim() === '');
    console.log(`📋 Total Empty Rows Found: ${emptyRows.length}`);

    if (emptyRows.length === 0) {
        console.log("🎉 All clean! Nothing to do.");
        return;
    }

    // 2. Process
    for (let i = 0; i < emptyRows.length; i += CONCURRENCY) {
        const chunk = emptyRows.slice(i, i + CONCURRENCY);
        console.log(`\n⚡️ Processing Empty Chunk ${i} ~ ${i + chunk.length} / ${emptyRows.length}`);

        const promises = chunk.map(async (row) => {
            const rawText = row.get('제목') + " " + (row.get('비고') || "");
            const res = await analyzeItem(model, normalizeText(rawText));

            if (res.headline) {
                row.set('ai_headline', res.headline);
                row.set('ai_support', res.support);
                return row;
            }
            return null;
        });

        const results = await Promise.all(promises);
        const toSave = results.filter(r => r);

        if (toSave.length > 0) {
            // Save with care (1s delay between items to be safe)
            /* Actually, let's try parallel save with error handling */
            for (const r of toSave) {
                try {
                    await r.save();
                    process.stdout.write('✅');
                    await new Promise(r => setTimeout(r, 200)); // 0.2s delay
                } catch (e) {
                    process.stdout.write('❌');
                }
            }
            console.log(` (Saved ${toSave.length})`);
        }

        // Cooldown
        await new Promise(r => setTimeout(r, 2000));
    }

    console.log("\n🏁 Mission Complete!");
}

main().catch(console.error);
