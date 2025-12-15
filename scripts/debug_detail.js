const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();

    try {
        console.log('Navigating to list page...');
        await page.goto('https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', { waitUntil: 'networkidle2' });

        // 1. Click 묘지 Tab
        console.log("Clicking '묘지' tab...");
        const foundTab = await page.evaluateHandle(() => {
            const links = Array.from(document.querySelectorAll('a.facgroupcd'));
            return links.find(a => a.innerText.includes('묘지'));
        });
        if (foundTab && foundTab.asElement()) {
            await foundTab.asElement().click();
            await new Promise(r => setTimeout(r, 2000));
        } else {
            console.error("'묘지' tab not found!");
            return;
        }

        // 2. Search
        const searchName = '낙원추모공원';
        console.log(`Searching for: ${searchName}`);
        await page.evaluate((term) => {
            const input = document.querySelector('#search_company');
            if (input) {
                input.value = term;
            }
        }, searchName);
        await page.click('#btn_search');
        await new Promise(r => setTimeout(r, 3000));

        // 3. Check Results
        const count = await page.$$eval('#loc li', items => items.length);
        console.log(`Found ${count} items.`);

        if (count > 0) {
            const firstItem = await page.$('#loc li:first-child .fac_tit a');
            if (firstItem) {
                const title = await page.evaluate(el => el.innerText, firstItem);
                console.log(`First item title: "${title}"`);

                console.log("Entering detail page...");
                await Promise.all([
                    page.waitForNavigation({ waitUntil: 'networkidle0' }),
                    firstItem.click()
                ]);
                console.log("Detail page loaded. Checking tabs...");

                // 4. Dump Tabs
                const tabTexts = await page.evaluate(() => {
                    // Try standard tab selectors
                    const tabs = Array.from(document.querySelectorAll('ul.tab_type01 li a, .tab_menu a, ul.tabs li a')); // Generic guess
                    // Also just all links to see
                    return tabs.map(t => t.innerText.trim());
                });
                console.log("--- TABS FOUND ---");
                console.log(tabTexts);

                // Check for Photo tab specifically
                const photoTabs = await page.$x("//a[contains(text(), '사진')]");
                console.log(`XPath //a[contains(text(), '사진')] count: ${photoTabs.length}`);

            } else {
                console.error("Could not select first item link.");
            }
        } else {
            console.error("No items found.");
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
