const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const START_ID = 2;
const END_ID = 5; // Test 2 ~ 5
const OUTPUT_DIR = path.join(process.cwd(), 'archive4_test');

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    for (let id = START_ID; id <= END_ID; id++) {
        const page = await browser.newPage();
        try {
            console.log(`\n🚀 Processing ID: ${id}...`);
            await page.setViewport({ width: 1920, height: 1200, deviceScaleFactor: 2 });
            await page.emulateMediaType('screen');

            // 1. Go to URL
            /* Special handling for 404/Empty pages? 
               We simply let it run, if name fails it will be named "Unknown". */
            await page.goto(`https://www.goifuneral.co.kr/facilities/${id}/`, { waitUntil: 'networkidle2', timeout: 30000 });

            // 2. Auto-Scroll (Full Page Load)
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
                    }, 50); // Faster scroll for speed
                });
            });
            await new Promise(r => setTimeout(r, 800)); // Wait for render

            // 3. Click "시설 사용료" Tab
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
                if (clicked) await new Promise(r => setTimeout(r, 2000)); // Wait for tab load
            } catch (e) {
                console.log(`   ⚠️ Tab click warning: ${e.message}`);
            }

            // 4. Get Name
            let name = "Unknown";
            try {
                const h1 = await page.$('h1');
                if (h1) name = await page.evaluate(el => el.innerText.trim(), h1);

                if (name === "Unknown" || !name) {
                    name = await page.$eval('ol.chakra-breadcrumb > li:last-child > a > span', el => el.innerText.trim());
                }
            } catch (e) { }
            console.log(`   🏷️ Name: ${name}`);

            // 5. Save Screenshot
            const safeName = name.replace(/[\/\\?%*:|"<>]/g, '_');
            const filename = `${id}.${safeName}_screen.png`;
            const filepath = path.join(OUTPUT_DIR, filename);

            await page.screenshot({ path: filepath, fullPage: true, type: 'png' });
            console.log(`   ✅ Saved: ${filename}`);

        } catch (e) {
            console.error(`   ❌ Error [${id}]: ${e.message}`);
        } finally {
            await page.close();
        }
    }

    await browser.close();
    console.log("\n🏁 Test Crawl Complete!");
}

main();
