const puppeteer = require('puppeteer');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');

// === CONFIG ===
const SHEET_ID = '1mBEC8i1jPMxVs5jNp-st_4c3MsWMPu90hU2KeUcSlyE';
const TARGET_SHEET_TITLE = '시트6';
const CREDENTIALS_PATH = 'credentials.json';
const START_ID = 1;
const END_ID = 1246; // FULL PRODUCTION
const CONCURRENCY = 5;
const SUPABASE_BASE_URL = 'https://jbydmhfuqnpukfutvrgs.supabase.co/storage/v1/object/public/facilities';

// Clean Headers (Simplified)
const HEADERS = [
    'ID', '시설명',
    '유형', '종교', '운영',
    '항목', '내역', '요금'
];

async function main() {
    console.log("🚀 STARTING SCRAPE & SYNC (1~3)...");

    // 1. Setup Sheet
    const creds = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), CREDENTIALS_PATH), 'utf8'));
    const jwt = new JWT({ email: creds.client_email, key: creds.private_key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] });
    const doc = new GoogleSpreadsheet(SHEET_ID, jwt);
    await doc.loadInfo();

    let sheet = doc.sheetsByTitle[TARGET_SHEET_TITLE];
    if (sheet) {
        console.log(`🗑️ Deleting existing '${TARGET_SHEET_TITLE}'...`);
        await sheet.delete();
    }

    console.log(`✨ Creating new '${TARGET_SHEET_TITLE}'...`);
    sheet = await doc.addSheet({ title: TARGET_SHEET_TITLE, headerValues: HEADERS });

    // 2. Launch Browser
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    // 3. Queue System
    let queue = [];
    for (let i = START_ID; i <= END_ID; i++) queue.push(i);

    async function processId(id) {
        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 1024 });

        try {
            await page.goto(`https://www.goifuneral.co.kr/facilities/${id}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });

            // A. Info Scrape
            let info = { name: "", tags: [], address: "", phone: "" };

            try {
                // Name
                info.name = await page.$eval('h1', el => el.innerText.trim());

                // Tags: Look for text in chakra-stack near H1
                const tagText = await page.$$eval('div[class*="chakra-stack"]', divs => divs.map(d => d.innerText).join(' '));
                const keywords = ["자연", "수목", "잔디", "봉안", "묘지", "공설", "사설", "재단", "법인", "기독교", "불교", "천주교", "가톨릭"];
                info.tags = keywords.filter(k => tagText.includes(k));

                // Facility Info Table (Address, Operation Type)
                // Look for table with text "주소" or "공·사설 구분"
                const infoTableText = await page.$$eval('div', divs => divs.map(d => d.innerText));
                const addressBlock = infoTableText.find(t => t.includes("주소") && t.includes("경상") || t.includes("경기") || t.includes("서울"));
                if (addressBlock) {
                    const lines = addressBlock.split('\n');
                    const addrIdx = lines.findIndex(l => l.includes("주소"));
                    if (addrIdx !== -1 && lines[addrIdx + 1]) info.address = lines[addrIdx + 1];
                }

            } catch (e) { }

            // Tag Categorization
            let type = "", religion = "", operation = "";
            info.tags.forEach(t => {
                if (['자연', '수목', '잔디', '봉안', '묘지'].some(k => t.includes(k))) type = t;
                if (['공설', '사설', '재단', '법인'].some(k => t.includes(k))) operation = t;
                if (['기독교', '불교', '천주교', '가톨릭'].some(k => t.includes(k))) religion = t;
            });
            if (!religion) religion = "무관"; // Default if not found

            // B. Pricing Table
            let prices = [];
            // Click Tab
            try {
                const tabs = await page.$$('button, h2, div[role="tab"]');
                for (const t of tabs) {
                    const text = await t.evaluate(el => el.innerText);
                    if (text.includes("시설 사용료")) {
                        await t.click();
                        await new Promise(r => setTimeout(r, 500));
                        break;
                    }
                }

                await page.waitForSelector('table', { timeout: 2000 });
                prices = await page.evaluate(() => {
                    const rows = Array.from(document.querySelectorAll('table tbody tr'));
                    return rows.map(tr => {
                        const cells = Array.from(tr.querySelectorAll('td'));
                        const clean = (text) => text ? text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim() : "";
                        return {
                            category: clean(cells[0]?.innerText),
                            details: clean(cells[1]?.innerText),
                            price: clean(cells[2]?.innerText)
                        };
                    }).filter(r => r.category);
                });
            } catch (e) { /* No table found */ }

            // C. Rows
            let rowsToAdd = [];

            if (prices.length === 0) {
                rowsToAdd.push({
                    'ID': id, '시설명': info.name,
                    '유형': type, '종교': religion, '운영': operation,
                    '항목': '-', '내역': '-', '요금': '-'
                });
            } else {
                prices.forEach(p => {
                    rowsToAdd.push({
                        'ID': id, '시설명': info.name,
                        '유형': type, '종교': religion, '운영': operation,
                        '항목': p.category, '내역': p.details, '요금': p.price
                    });
                });
            }
            return rowsToAdd;

        } catch (e) {
            console.error(`❌ Error [${id}]: ${e.message}`);
            return null;
        } finally {
            await page.close();
        }
    }

    // Worker Loop
    while (queue.length > 0) {
        const batch = queue.splice(0, CONCURRENCY);
        console.log(`\n⚡️ Processing Batch: ${batch[0]} ~ ...`);

        const results = await Promise.all(batch.map(id => processId(id)));
        const flatRows = results.flat().filter(r => r);

        if (flatRows.length > 0) {
            try {
                await sheet.addRows(flatRows);
                process.stdout.write(`   ✅ Saved ${flatRows.length} rows.`);
            } catch (e) {
                console.log(`   ⚠️ Sheet Save Error: ${e.message}`);
                // Simple retry
                await new Promise(r => setTimeout(r, 2000));
                try { await sheet.addRows(flatRows); } catch (e) { }
            }
        }
        await new Promise(r => setTimeout(r, 1000)); // Rate limit
    }

    await browser.close();
    console.log("\n🏁 Done!");
}

main().catch(console.error);
