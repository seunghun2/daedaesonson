
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // 헤드리스 끄고 직접 봄
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const url = 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000';
    await page.goto(url, { waitUntil: 'networkidle2' });

    // HTML 덤프
    const html = await page.content();
    fs.writeFileSync('esky_real_dump.html', html);
    console.log('Saved esky_real_dump.html');

    await browser.close();
})();
