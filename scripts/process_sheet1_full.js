const fs = require('fs');
const path = require('path');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const TARGET_SHEET_TITLE = '시트1';
const SOURCE_FILE = 'data/pricing_class_final.json';
const HEADLINE_RESULTS_PATH = 'data/headline_results.json';
const CREDENTIALS_PATH = 'credentials.json';
const API_KEY = "AIzaSyD2qMR8nAEhxZNzbFhJPIz1EgUfNb8pdwE";
const CONCURRENCY = 50; // Increased speed

function normalizeText(text) {
    if (!text) return "";
    return text.replace(/[\s,0-9]+원?$/, '').trim();
}

async function analyzeItemImmediate(model, text) {
    const prompt = `
Task: Extract 'headline' (Product Name) and 'support' (Details).
Input: "${text}"
Rules:
1. Headline: Core product name.
2. Support: Details.
3. REMOVE PRICES.
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
    console.log("🚀 INFINITE LOOP MODE (Concurrency 100)...");

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const rawData = JSON.parse(fs.readFileSync(SOURCE_FILE, 'utf8'));
    const creds = JSON.parse(fs.readFileSync(path.join(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });

    // INFINITE LOOP
    let loopCount = 1;
    while (true) {
        console.log(`\n🔄 === LOOP ${loopCount} START ===`);

        try {
            // Load Sheet (Refresh every loop to see latest state)
            const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
            await doc.loadInfo();
            const sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
            await sheet.loadHeaderRow();
            const rows = await sheet.getRows();

            let updatedInThisLoop = 0;

            for (let i = 0; i < rows.length; i += CONCURRENCY) {
                const chunk = rows.slice(i, i + CONCURRENCY);

                // Only process chunk if at least one row needs update
                const needsUpdate = chunk.some(r => !r.get('ai_headline'));
                if (!needsUpdate) {
                    process.stdout.write('.'); // Dot for skip
                    continue;
                }

                console.log(`\n⚡️ Processing chunk ${i} ~ ${i + chunk.length}...`);

                // Create Promise Array
                const promises = chunk.map(async (row) => {
                    if (row.get('ai_headline')) return null; // Skip individually

                    const title = normalizeText(row.get('제목'));

                    // 1. Fuzzy Match
                    let idx = -1;
                    for (let j = 0; j < rawData.length; j++) {
                        const rTitle = normalizeText(rawData[j].itemName2);
                        if (rTitle === title || (title.length > 2 && rTitle.includes(title))) {
                            idx = j;
                            break;
                        }
                    }

                    // 2. Load Cache
                    let aiResults = {};
                    try { aiResults = JSON.parse(fs.readFileSync(HEADLINE_RESULTS_PATH, 'utf8')); } catch (e) { }

                    let resData = idx !== -1 ? aiResults[String(idx)] : null;

                    // 3. Analyze if needed
                    if (!resData || !resData.headline) {
                        const text = idx !== -1
                            ? (rawData[idx].itemName2 || "") + " " + (rawData[idx].rawText || "")
                            : title + " " + normalizeText(row.get('비고')); // Fallback

                        try {
                            const aiRes = await analyzeItemImmediate(model, text);
                            resData = { headline: aiRes.headline, support: aiRes.support };

                            // Save Cache (if identified)
                            if (idx !== -1) {
                                aiResults[String(idx)] = { ...resData, id: idx };
                                fs.writeFileSync(HEADLINE_RESULTS_PATH, JSON.stringify(aiResults, null, 2));
                            }
                        } catch (e) {
                            return null; // AI Failed, try next loop
                        }
                    }

                    row.set('ai_headline', resData.headline);
                    row.set('ai_support', resData.support);
                    return row;
                });

                // Execute Batch
                try {
                    const solvedRows = await Promise.all(promises);
                    const rowsToSave = solvedRows.filter(r => r);

                    if (rowsToSave.length > 0) {
                        // Sequential Save with Delay (Avoid 429 Error)
                        for (const r of rowsToSave) {
                            try {
                                await r.save();
                                await new Promise(res => setTimeout(res, 500)); // 0.5s throttle (Very Safe)
                            } catch (e) {
                                console.log(`   ❌ Save Failed: ${e.message}`);
                            }
                        }
                        console.log(`   ✅ Saved ${rowsToSave.length} rows. Cooling down...`);
                        await new Promise(res => setTimeout(res, 2000)); // 2s Cool-down check
                        updatedInThisLoop += rowsToSave.length;
                    }
                } catch (e) {
                    console.log(`   ⚠️ Chunk Warning: ${e.message} (Continuing...)`);
                }
            }

            console.log(`\n🏁 Loop ${loopCount} Done. Updated: ${updatedInThisLoop}`);
            if (updatedInThisLoop === 0) {
                console.log("💤 No updates needed. Sleeping 10s...");
                await new Promise(r => setTimeout(r, 10000));
            }

        } catch (e) {
            console.error(`❌ CRITICAL ERROR in Loop: ${e.message}`);
            console.log("💤 Restarting loop in 5 seconds...");
            await new Promise(r => setTimeout(r, 5000));
        }

        loopCount++;
    }
}

main().catch(console.error);
