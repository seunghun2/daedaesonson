const puppeteer = require('puppeteer');

const TARGET_ID = 1;

async function main() {
    console.log(`🚀 Testing Direct Scraping for ID ${TARGET_ID} ...`);

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        await page.goto(`https://www.goifuneral.co.kr/facilities/${TARGET_ID}/`, { waitUntil: 'networkidle2' });

        // A. Facility Info
        let info = { name: "", address: "", phone: "", tags: [] };

        // Name
        try {
            info.name = await page.$eval('h1', el => el.innerText.trim());
        } catch (e) { }

        // Tags (e.g., 자연, 공설) - Usually spans near title or in a badge container
        try {
            info.tags = await page.$$eval('span[class*="Badge"]', els => els.map(e => e.innerText.trim()));
            if (info.tags.length === 0) {
                // Try looking for text inside specific containers if Badges use dynamic classes
                // Identifying tags: usually small colored boxes. 
            }
        } catch (e) { }

        // Address & Phone - Usually in a definition list (dl/dt/dd) or footer-like info area
        // Let's dump all text to find patterns or look for specific icons/labels
        const pageText = await page.evaluate(() => document.body.innerText);

        // ... Wait, let's try to find structured info first
        // Try to find "주소" or "전화번호" label
        // (Assuming standard layout code from previous crawls)

        // B. Pricing Table
        let prices = [];

        // Click Tab
        try {
            const tabs = await page.$$('button, h2, div[role="tab"]');
            for (const t of tabs) {
                const text = await t.evaluate(el => el.innerText);
                if (text.includes("시설 사용료")) {
                    console.log(`🖱️ Clicking Price Tab...`);
                    await t.click();
                    await new Promise(r => setTimeout(r, 1000)); // Wait for render
                    break;
                }
            }
        } catch (e) { }

        // Scrape Table
        try {
            // Find table
            prices = await page.evaluate(() => {
                const rows = Array.from(document.querySelectorAll('table tbody tr'));
                return rows.map(tr => {
                    const cells = Array.from(tr.querySelectorAll('td'));
                    return {
                        category: cells[0]?.innerText.trim() || "",
                        details: cells[1]?.innerText.trim() || "",
                        price: cells[2]?.innerText.trim() || ""
                    };
                }).filter(r => r.category && r.price);
            });
        } catch (e) { }

        console.log("\n📊 Scraped Data:");
        console.log("Info:", info);
        console.log("Prices Sample:", prices.slice(0, 3));
        console.log(`Total Prices: ${prices.length}`);

    } catch (e) {
        console.error("❌ Error:", e);
    } finally {
        await browser.close();
    }
}

main();
