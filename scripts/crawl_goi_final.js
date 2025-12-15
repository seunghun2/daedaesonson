const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const START_ID = 1;
const END_ID = 1246;
const OUTPUT_DIR = path.join(process.cwd(), 'archive4');
const CONCURRENCY = 3; // Keep it modest to allow Sheet process to run smooth

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`🚀 Final Crawl Started: ${START_ID} ~ ${END_ID}`);
    console.log(`📂 Output: ${OUTPUT_DIR}`);

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    let queue = [];
    for (let i = START_ID; i <= END_ID; i++) queue.push(i);

    async function processId(id) {
        const page = await browser.newPage();
        try {
            await page.setViewport({ width: 1920, height: 1200, deviceScaleFactor: 2 });
            await page.emulateMediaType('screen');

            // 1. Go to URL
            await page.goto(`https://www.goifuneral.co.kr/facilities/${id}/`, { waitUntil: 'networkidle2', timeout: 40000 });

            // 2. Auto-Scroll
            await page.evaluate(async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;
                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve();
                        }
                    }, 50);
                });
            });
            await new Promise(r => setTimeout(r, 800));

            // 3. Click Tab
            try {
                const tabs = await page.$$('button, h2, div[role="tab"]');
                let clicked = false;
                for (const t of tabs) {
                    const text = await t.evaluate(el => el.innerText);
                    if (text.includes("시설 사용료")) {
                        await t.click();
                        clicked = true;
                        break;
                    }
                }
                if (clicked) await new Promise(r => setTimeout(r, 2000));
            } catch (e) { }

            // 4. Get Name
            let name = "Unknown";
            try {
                const h1 = await page.$('h1');
                if (h1) name = await page.evaluate(el => el.innerText.trim(), h1);

                if (name === "Unknown" || !name) {
                    name = await page.$eval('ol.chakra-breadcrumb > li:last-child > a > span', el => el.innerText.trim());
                }
            } catch (e) { }

            // 5. Save Screenshot
            const safeName = name.replace(/[\/\\?%*:|"<>]/g, '_');
            const filename = `${id}.${safeName}.png`;
            const filepath = path.join(OUTPUT_DIR, filename);

            await page.screenshot({ path: filepath, fullPage: true, type: 'png' });
            console.log(`✅ [${id}] Saved: ${filename}`);

        } catch (e) {
            console.error(`⚠️ [${id}] Error: ${e.message}`);
        } finally {
            await page.close();
        }
    }

    // Worker Loop
    while (queue.length > 0) {
        const batch = queue.splice(0, CONCURRENCY);
        await Promise.all(batch.map(id => processId(id)));
    }

    await browser.close();
    console.log("🏁 All Done!");
}

main();
