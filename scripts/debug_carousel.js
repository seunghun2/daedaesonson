const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.GOOGLE_CHROME_BIN || undefined
    });
    const page = await browser.newPage();

    try {
        // 1. Navigate and Search (Reusing known working logic)
        await page.goto('https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', { waitUntil: 'networkidle2' });

        // Click '묘지' tab
        const tab = await page.evaluateHandle(() => {
            const tabs = Array.from(document.querySelectorAll('a.facgroupcd'));
            return tabs.find(t => t.innerText.includes('묘지'));
        });
        if (tab) await tab.click();
        await new Promise(r => setTimeout(r, 1000));

        // Search
        await page.type('#search_company', '낙원추모공원');
        await page.click('#btn_search');
        await new Promise(r => setTimeout(r, 2000));

        // Click result
        await page.evaluate(() => {
            const listItems = Array.from(document.querySelectorAll('#loc li'));
            const target = listItems.find(li => li.innerText.includes('낙원추모공원'));
            if (target) target.querySelector('a').click();
        });
        await new Promise(r => setTimeout(r, 3000));

        // 2. Click '사진' tab
        await page.evaluate(() => {
            const tabs = Array.from(document.querySelectorAll('.tab_area ul li a, .tab_list li a, li[onclick]'));
            const photoTab = tabs.find(t => t.innerText.trim() === '사진' || t.innerText.trim() === '시설사진' || t.innerText.trim() === '갤러리');
            if (photoTab) photoTab.click();
        });
        await new Promise(r => setTimeout(r, 3000)); // Wait for photos to load

        // 3. Inspect Structure
        console.log('--- Inspecting Photo Tab Structure ---');

        const structure = await page.evaluate(() => {
            const box = document.querySelector('.facimg_box');
            if (!box) return { error: '.facimg_box not found' };

            const parent = box.parentElement;

            return {
                boxHTML: box.outerHTML,
                parentHTML: parent.outerHTML, // This should contain the controls
                imageSrc: box.querySelector('img') ? box.querySelector('img').src : 'no image'
            };
        });

        console.log('Box HTML:', structure.boxHTML);
        console.log('Parent HTML (truncated):', structure.parentHTML.substring(0, 500) + '...');
        console.log('Initial Image:', structure.imageSrc);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await browser.close();
    }
})();
