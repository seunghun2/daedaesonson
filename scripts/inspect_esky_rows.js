const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: null,
    });
    const page = await browser.newPage();
    const LIST_URL = 'https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000';
    await page.goto(LIST_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    console.log('Page loaded');
    // Wait for table rows to appear
    await page.waitForSelector('table.list01 tbody tr', { timeout: 30000 });
    const rows = await page.$$eval('table.list01 tbody tr', trs => trs.map(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.innerText.trim());
        const link = tr.querySelector('a') ? tr.querySelector('a').href : null;
        return { cells, link };
    }));
    console.log('Rows extracted:', rows.slice(0, 5));
    await browser.close();
})();
