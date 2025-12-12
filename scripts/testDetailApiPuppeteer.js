
const puppeteer = require('puppeteer');

const endpoints = [
    '/portal/fnlfac/fac_view.ajax',
    '/portal/fnlfac/fac_detail.ajax',
    '/portal/index/fac/fac_view.ajax'
];

const facilitycd = '4000000036';

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', { waitUntil: 'networkidle2' });

    for (const ep of endpoints) {
        console.log(`Testing ${ep}...`);
        try {
            const result = await page.evaluate(async (url, id) => {
                try {
                    const params = new URLSearchParams();
                    params.append('facilitycd', id);
                    const res = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                        body: params
                    });
                    const text = await res.text();
                    return { status: res.status, text: text.substring(0, 500) };
                } catch (e) {
                    return { error: e.toString() };
                }
            }, ep, facilitycd);

            console.log('Result:', result);
        } catch (e) {
            console.error('Puppeteer Error:', e);
        }
    }

    await browser.close();
})();
