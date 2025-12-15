const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, '../data/funeral_list_from_web.json');
const TARGET_URL = "https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000";

(async () => {
    const browser = await puppeteer.launch({
        headless: true, // Headless is fine for scraping list
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();

    console.log(`Navigating to ${TARGET_URL}...`);
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2' });

    // 1. Click "장례식장" tab
    try {
        await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a.facgroupcd'));
            const tab = links.find(a => a.innerText.includes('장례식장'));
            if (tab) tab.click();
        });
        await new Promise(r => setTimeout(r, 2000));
        await page.waitForSelector('#loc li', { timeout: 10000 });
        console.log("Clicked '장례식장' tab.");
    } catch (e) {
        console.error("Failed to click tab:", e);
    }

    let allItems = [];
    let pageNum = 1;

    while (true) {
        console.log(`Scraping page ${pageNum}...`);

        // Extract items
        const items = await page.evaluate(() => {
            const list = [];
            const lis = document.querySelectorAll('#loc li');
            lis.forEach(li => {
                const nameEl = li.querySelector('.fac_tit a') || li.querySelector('a');
                const addrEl = li.querySelector('.fac_addr');
                const telEl = li.querySelector('.fac_tel'); // Check class name

                if (nameEl) {
                    // Extract ID/Link from onclick or href
                    // Example onclick: "fn_view('1000000069'); return false;"
                    const onclick = nameEl.getAttribute('onclick');
                    console.log(`Debug Onclick: ${onclick}`); // Debug extraction

                    let facilityId = null;
                    if (onclick) {
                        // Match '123' or "123" inside fn_view
                        const match = onclick.match(/fn_view\(['"]?(\w+)['"]?\)/);
                        if (match) facilityId = match[1];
                    }

                    list.push({
                        companyname: nameEl.innerText.trim(),
                        fulladdress: addrEl ? addrEl.innerText.trim() : '',
                        telephone: telEl ? telEl.innerText.trim() : '',
                        facilitycd: facilityId,
                        rno: 0
                    });
                }
            });
            return list;
        });

        if (items.length === 0) {
            console.log("No items found on this page. Ending.");
            break;
        }

        allItems = allItems.concat(items);
        console.log(`Found ${items.length} items. Total: ${allItems.length}`);

        // Screenshot for debug
        if (pageNum === 1) await page.screenshot({ path: `archive/debug_list_page_${pageNum}.png` });

        // Pagination
        // Check for updates
        const firstItemName = items[0].companyname;

        // Try calling fn_link_page directly
        const nextSuccess = await page.evaluate((targetPage) => {
            if (typeof fn_link_page === 'function') {
                console.log(`Calling fn_link_page(${targetPage})`);
                fn_link_page(targetPage);
                return true;
            }
            return false;
        }, pageNum + 1);

        if (!nextSuccess) {
            console.log("fn_link_page not found. Trying click fallback...");
            // logic from before...
            // ...
            // For now assume fn_link_page works as it's standard government site
        }

        // Wait for reload
        await new Promise(r => setTimeout(r, 3000));

        // Check if content changed
        const newFirstItem = await page.evaluate(() => {
            const el = document.querySelector('#loc li .fac_tit a');
            return el ? el.innerText.trim() : null;
        });

        if (newFirstItem === firstItemName) {
            console.log("Content did not change after navigation. Assuming end of list.");
            break;
        }

        pageNum++;
    }

    // Assign RNOs
    allItems = allItems.map((item, index) => ({ ...item, rno: index + 1 }));

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allItems, null, 2), 'utf-8');
    console.log(`Saved ${allItems.length} items to ${OUTPUT_FILE}`);

    await browser.close();
})();
