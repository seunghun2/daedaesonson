
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', { waitUntil: 'networkidle2' });

    const result = await page.evaluate(async () => {
        const params = new URLSearchParams();
        params.append('facilitycd', '4000000036'); // 포항시우현화장장
        const res = await fetch('/portal/fnlfac/fac_detail.ajax', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
            body: params
        });
        return await res.json();
    });

    fs.writeFileSync('esky_detail_full.json', JSON.stringify(result, null, 2));
    console.log('Saved esky_detail_full.json');

    await browser.close();
})();
