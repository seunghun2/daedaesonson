
const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 카테고리 코드 분석 시작...');
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const url = 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000';
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('📸 페이지 스크린샷...');
    await page.screenshot({ path: 'category_analysis.png' });

    // 코드 추출 시도
    const codes = await page.evaluate(() => {
        const results = [];

        // 1. 탭이나 버튼에서 코드 찾기
        // onclick="fn_search('TBC0700001')" 이런 식일 수 있음.
        const elements = document.querySelectorAll('a, button, li');
        elements.forEach(el => {
            const html = el.outerHTML;
            if (html.includes('TBC')) {
                results.push({
                    text: el.innerText,
                    html: html.substring(0, 200) // 너무 길면 자름
                });
            }
        });

        // 2. Select 박스에서 찾기
        const selects = document.querySelectorAll('select option');
        selects.forEach(opt => {
            if (opt.value && opt.value.includes('TBC')) {
                results.push({
                    text: opt.innerText,
                    value: opt.value
                });
            }
        });

        return results;
    });

    console.log('🔎 발견된 코드들:', codes);
    await browser.close();
})();
