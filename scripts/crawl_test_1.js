const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const TARGET_ID = 1;
const OUTPUT_DIR = path.join(process.cwd(), 'archive4_test');

async function main() {
    if (!fs.existsSync(OUTPUT_DIR)) {
        fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    }

    console.log(`🚀 Testing Crawl for ID ${TARGET_ID} ...`);

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });

    const page = await browser.newPage();

    try {
        // 1. Set Desktop Viewport & Screen Media
        await page.setViewport({ width: 1920, height: 1200, deviceScaleFactor: 2 });
        await page.emulateMediaType('screen'); // Important: Capture exactly as seen on screen

        // 2. Go to Page
        await page.goto(`https://www.goifuneral.co.kr/facilities/${TARGET_ID}/`, { waitUntil: 'networkidle2', timeout: 30000 });
        console.log("✅ Page Loaded");

        // --- IMPROVEMENT: Scroll to bottom to trigger lazy load ---
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
                }, 100);
            });
        });
        await new Promise(r => setTimeout(r, 1000)); // Wait after scroll
        // ----------------------------------------------------------

        // 3. Find & Click "시설 사용료" Tab
        try {
            // Updated Selector: Try looking for text inside tabs
            const tabs = await page.$$('button, h2, div[role="tab"]');
            let clicked = false;
            for (const t of tabs) {
                const text = await t.evaluate(el => el.innerText);
                if (text.includes("시설 사용료")) {
                    console.log(`🖱️ Clicking tab with text: "${text}"`);
                    await t.click();
                    clicked = true;
                    break;
                }
            }

            if (clicked) {
                await new Promise(r => setTimeout(r, 3000));
                console.log("✅ Waited for content load.");
            } else {
                console.log("⚠️ Tab '시설 사용료' NOT found.");
            }
        } catch (e) {
            console.log("⚠️ Tab Click Error: " + e.message);
        }

        // 5. Get Name (More Robust)
        let name = "Unknown";
        try {
            // Try H1 first
            const h1 = await page.$('h1');
            if (h1) name = await page.evaluate(el => el.innerText.trim(), h1);

            // Fallback to breadcrumb
            if (name === "Unknown" || !name) {
                name = await page.$eval('ol.chakra-breadcrumb > li:last-child > a > span', el => el.innerText.trim());
            }
        } catch (e) { }
        console.log(`🏷️ Facility Name: ${name}`);

        // 6. Save as Full Page Screenshot (Prevent cut-off)
        const filename = `${TARGET_ID}.${name}_screen.png`;
        const filepath = path.join(OUTPUT_DIR, filename);

        await page.screenshot({
            path: filepath,
            fullPage: true,
            type: 'png'
        });

        console.log(`🎉 Saved Image: ${filepath}`);

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await browser.close();
    }
}

main();
