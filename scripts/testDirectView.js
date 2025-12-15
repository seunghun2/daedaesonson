
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // 추측 URL
    const url = 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_view.do?facilitycd=4000000036&menuId=M0001000100000000';
    console.log(`Testing URL: ${url}`);

    await page.goto(url, { waitUntil: 'networkidle2' });

    const title = await page.title();
    console.log(`Page Title: ${title}`);

    // "시설사진" 텍스트 존재 여부 확인
    const hasPhotoTab = await page.evaluate(() => {
        return document.body.innerText.includes('시설사진');
    });
    console.log(`Has '시설사진' text: ${hasPhotoTab}`);

    await browser.close();
})();
