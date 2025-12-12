const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: { width: 1920, height: 1080 },
        args: ['--start-maximized', '--window-size=1920,1080'],
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    });

    const page = await browser.newPage();
    try {
        await page.goto('https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', { waitUntil: 'networkidle2' });

        const SEARCH_NAME = '낙원추모공원';
        const tabsToCheck = ['묘지', '봉안시설', '자연장지', '장례식장'];
        let found = false;

        for (const tabName of tabsToCheck) {
            console.log(`Checking Tab: ${tabName}`);
            const foundTab = await page.evaluateHandle((text) => {
                const links = Array.from(document.querySelectorAll('a.facgroupcd'));
                return links.find(a => a.innerText.includes(text));
            }, tabName);

            if (foundTab && foundTab.asElement()) {
                await foundTab.asElement().click();
                await new Promise(r => setTimeout(r, 2000));

                await page.evaluate((term) => {
                    const input = document.querySelector('#search_company');
                    if (input) {
                        input.value = term;
                    }
                }, SEARCH_NAME);
                await page.click('#btn_search');
                await new Promise(r => setTimeout(r, 3000));

                const resultClicked = await page.evaluate(() => {
                    const items = Array.from(document.querySelectorAll('#loc li'));
                    for (let li of items) {
                        if (li.innerText.includes('낙원추모공원')) {
                            // Try different selectors for the link
                            let a = li.querySelector('.fac_tit a');
                            if (!a) a = li.querySelector('a');
                            if (a) { a.click(); return true; }
                        }
                    }
                    return false;
                });

                if (resultClicked) {
                    console.log(`Found and clicked in ${tabName}`);
                    found = true;
                    await page.waitForNavigation({ waitUntil: 'networkidle0' });
                    break;
                }
            }
        }

        if (!found) throw new Error("Could not find facility in any tab");

        // Click Photo Tab
        console.log("On detail page. Clicking Photo tab...");
        const photoTabClicked = await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('a, button, li'));
            const target = tabs.find(el => ['사진', '시설사진', '갤러리'].includes(el.innerText.trim()));
            if (target) { target.click(); return true; }
            return false;
        });

        if (photoTabClicked) {
            await new Promise(r => setTimeout(r, 3000));

            // Inspect the structure
            const structure = await page.evaluate(() => {
                // Find the active tab content area? 
                // Usually tabs toggle visibility of divs.
                // Let's look for the container of the images
                const images = Array.from(document.querySelectorAll('img'));
                return images.map(img => ({
                    src: img.src,
                    parentClass: img.parentElement.className,
                    grandParentClass: img.parentElement.parentElement.className,
                    containerId: img.closest('div[id]') ? img.closest('div[id]').id : null,
                    containerClass: img.closest('div[class]') ? img.closest('div[class]').className : null
                })).filter(info => info.src.length > 0 && !info.src.includes('logo') && !info.src.includes('icon'));
            });
            console.log("Image structure:", JSON.stringify(structure, null, 2));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
