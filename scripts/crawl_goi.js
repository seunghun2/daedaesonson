const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const START_ID = 1;
const END_ID = 1246;
const OUTPUT_DIR = path.join(process.cwd(), 'archive4');
const CONCURRENCY = 5; // 5 tabs at a time

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,1080']
    });

    console.log(`🚀 Starting Crawl: ID ${START_ID} ~ ${END_ID}`);

    // Process queue
    let queue = [];
    for (let i = START_ID; i <= END_ID; i++) {
        queue.push(i);
    }

    async function processId(id) {
        const page = await browser.newPage();
        try {
            await page.setViewport({ width: 1280, height: 1080 });
            await page.goto(`https://www.goifuneral.co.kr/facilities/${id}/`, { waitUntil: 'networkidle2', timeout: 30000 });

            // 1. Get Facility Name
            // Try breadcrumb or h1
            let name = "";
            try {
                name = await page.$eval('ol.chakra-breadcrumb > li:last-child > a > span', el => el.innerText.trim());
            } catch (e) {
                try {
                    name = await page.$eval('h1', el => el.innerText.trim());
                } catch (e2) {
                    name = "Unknown";
                }
            }

            if (!name || name === "Unknown") {
                // Check if page is valid (e.g. 404 text?)
                const text = await page.evaluate(() => document.body.innerText);
                if (text.includes("존재하지 않는") || text.includes("페이지를 찾을 수")) {
                    console.log(`❌ [${id}] Not Found (404)`);
                    return;
                }
            }

            // 2. Click '시설 사용료' tab if exists
            try {
                // Look for text "시설 사용료" inside headers or buttons
                const clicked = await page.evaluate(() => {
                    const tabs = Array.from(document.querySelectorAll('h2, button, div'));
                    const feeTab = tabs.find(el => el.innerText.includes('시설 사용료'));
                    if (feeTab) {
                        feeTab.click();
                        return true;
                    }
                    return false;
                });

                if (clicked) {
                    await new Promise(r => setTimeout(r, 1000)); // Wait for render
                }
            } catch (e) {
                // Ignore if tab interaction fails, just snapshot what's there
            }

            // 3. Save PDF
            // Clean filename
            const safeName = name.replace(/[\/\\?%*:|"<>]/g, '_');
            const filename = `${id}.${safeName}.pdf`;
            const filepath = path.join(OUTPUT_DIR, filename);

            await page.pdf({
                path: filepath,
                format: 'A4',
                printBackground: true,
                margin: { top: '1cm', bottom: '1cm' }
            });

            console.log(`✅ [${id}] Saved: ${filename}`);

        } catch (e) {
            console.error(`⚠️ [${id}] Error: ${e.message}`);
        } finally {
            await page.close();
        }
    }

    // Run with concurrency
    while (queue.length > 0) {
        const batch = queue.splice(0, CONCURRENCY);
        await Promise.all(batch.map(id => processId(id)));
    }

    await browser.close();
    console.log("🏁 Crawl Complete!");
}

main();
