
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Go to main page to get cookies/session
    await page.goto('https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do', { waitUntil: 'networkidle2' });

    // Call API
    const result = await page.evaluate(async () => {
        const formData = new FormData();
        formData.append('pageInqCnt', '10');
        formData.append('curPageNo', '1');
        // formData.append('facilitygroupcd', 'TBC0700001'); // Optional filter

        const res = await fetch('/portal/fnlfac/fac_list.ajax', {
            method: 'POST',
            body: formData
        });
        return await res.json();
    });

    console.log('API Result Keys:', Object.keys(result));
    if (result.list && result.list.length > 0) {
        console.log('First Item:', result.list[0]);
    }

    await browser.close();
})();
