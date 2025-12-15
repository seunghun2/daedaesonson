const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        args: ['--start-maximized'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });
    const page = await browser.newPage();

    try { // Start of try-catch block for main execution
        console.log('Navigating to list page...');
        await page.goto('https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', { waitUntil: 'networkidle2' });

        const searchName = '낙원추모공원'; // Removing (재) for broader match, we can filter later

        // Define tabs to check. 
        // We use text content to find them.
        const tabsToCheck = ['묘지', '봉안시설', '자연장지', '장례식장'];

        for (const tabName of tabsToCheck) {
            console.log(`\n--- Checking Tab: ${tabName} ---`);

            // 1. Click Tab
            // proper way to find element by text without $x
            const foundTab = await page.evaluateHandle((text) => {
                const links = Array.from(document.querySelectorAll('a.facgroupcd'));
                return links.find(a => a.innerText.includes(text));
            }, tabName);

            if (foundTab && foundTab.asElement()) {
                await foundTab.asElement().click();
                await new Promise(r => setTimeout(r, 2000)); // Wait for tab switch

                // 2. Ensure Region is All (if exists)
                const regionSelect = await page.$('#selSido');
                if (regionSelect) {
                    await page.select('#selSido', ''); // Try empty string for 'All'
                    await new Promise(r => setTimeout(r, 500));
                }

                // 3. Type Search
                await page.evaluate((term) => {
                    const input = document.querySelector('#search_company');
                    if (input) {
                        input.value = term;
                        // input.dispatchEvent(new Event('input', { bubbles: true })); // Sometimes needed
                    }
                }, searchName);

                // 4. Click Search
                await page.click('#btn_search');

                console.log('Clicked search, waiting...');
                await new Promise(r => setTimeout(r, 3000));

                // 5. Check Results
                // Check for "검색된 시설이 없습니다"
                const noResult = await page.evaluate(() => {
                    return document.body.innerText.includes('검색된 시설이 없습니다');
                });

                if (noResult) {
                    console.log(`Result: No facilities found in ${tabName}.`);

                    // Double check list count just in case text check is flaky
                    const count = await page.$$eval('#loc li', items => items.length);
                    console.log(`Li Count: ${count}`);
                } else {
                    // Check list items
                    const count = await page.$$eval('#loc li', items => items.length);
                    console.log(`Result: Found ${count} items in ${tabName}!`);

                    if (count > 0) {
                        const firstTitle = await page.$eval('#loc li:first-child .fac_tit a', el => el.innerText.trim());
                        console.log(`First Item: ${firstTitle}`);

                        console.log(`>>> FOUND TARGET IN TAB: ${tabName} <<<`);
                        break; // Stop loop if found
                    }
                }

            } else {
                console.log(`Could not find tab element for ${tabName}`);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        // await browser.close(); // Keep open to inspect
    }
})();
