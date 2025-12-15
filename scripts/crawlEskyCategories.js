
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const CATEGORIES = [
    { code: 'TBC0700002', name: '묘지' },
    { code: 'TBC0700003', name: '봉안시설' },
    { code: 'TBC0700004', name: '화장시설' },
    { code: 'TBC0700005', name: '자연장지' }
];

(async () => {
    console.log('🚀 e하늘 정밀 크롤링 시작 (Correct Codes)...');

    // Puppeteer 시작
    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 세션 생성을 위해 메인 페이지 접속
    await page.goto('https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', {
        waitUntil: 'networkidle2'
    });

    for (const cat of CATEGORIES) {
        console.log(`📡 Fetching ${cat.name} (${cat.code})...`);

        try {
            const data = await page.evaluate(async (code) => {
                const formData = new FormData();
                formData.append('pageInqCnt', '2000'); // 전체 조회
                formData.append('curPageNo', '1');
                formData.append('facilitygroupcd', code);

                const response = await fetch('/portal/fnlfac/fac_list.ajax', {
                    method: 'POST',
                    body: formData
                });
                return await response.json();
            }, cat.code);

            const list = data.list || [];
            console.log(`✅ ${cat.name}: ${list.length}건 확보`);

            // 파일 저장
            fs.writeFileSync(
                path.join(__dirname, `../esky_${cat.name}.json`),
                JSON.stringify(data, null, 2)
            );

        } catch (e) {
            console.error(`❌ ${cat.name} Fetch Error:`, e);
        }

        await new Promise(r => setTimeout(r, 1000));
    }

    await browser.close();
})();
