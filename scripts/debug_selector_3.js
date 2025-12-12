const puppeteer = require('puppeteer-core');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1920, height: 1080 }
    });

    const page = await browser.newPage();
    // mimic what we do in the main script
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    try {
        console.log('Navigating...');
        await page.goto('https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000#{%22page%22:1}', { waitUntil: 'networkidle2' });

        console.log('Waiting for category...');
        await page.waitForSelector('a.facgroupcd');

        console.log('Clicking category...');
        await page.click('a.facgroupcd');

        console.log('Waiting 5s...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('Scrolling...');
        await page.evaluate(() => window.scrollBy(0, 1000));

        console.log('Waiting 5s...');
        await new Promise(r => setTimeout(r, 5000));

        console.log('Checking selectors...');
        const listItemsCount = await page.$$eval('#loc li', items => items.length);
        console.log(`Found ${listItemsCount} items with selector #loc li`);

        if (listItemsCount > 0) {
            const firstItemAttrs = await page.$eval('#loc li', item => {
                const titleLink = item.querySelector('.fac_tit a');
                const btn = item.querySelector('.btn_facinfo');
                return {
                    titleOnClick: titleLink ? titleLink.getAttribute('onclick') : null,
                    btnOnClick: btn ? btn.getAttribute('onclick') : null,
                    title: titleLink ? titleLink.innerText : null
                };
            });
            console.log('First item details:', JSON.stringify(firstItemAttrs));

        } else {
            // Fallback: dump body
            const html = await page.content();
            console.log(html.substring(0, 2000));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await browser.close();
    }
})();
