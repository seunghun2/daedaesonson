
const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', { waitUntil: 'domcontentloaded' });

    const content = await page.content();

    // fn_view 검색
    const match = content.match(/function\s+fn_view\s*\([^)]*\)\s*\{([^}]*)\}/);
    if (match) {
        console.log('✅ fn_view Found:');
        console.log(match[0]);
    } else {
        console.log('❌ fn_view function not found in HTML text. Searching deeper...');
        // script 태그 src들도 확인해야 하지만 일단 본문 내 스크립트만.
    }

    // onclick="fn_view('...')" 패턴으로 ID 추출 시도
    const idMatch = content.match(/fn_view\('([0-9]+)'\)/);
    if (idMatch) {
        console.log(`✅ Sample ID found: ${idMatch[1]}`);
    }

    await browser.close();
})();
