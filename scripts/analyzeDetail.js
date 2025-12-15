
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🚀 상세 페이지 로직 분석 (Retry)...');
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    const url = 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000';
    await page.goto(url, { waitUntil: 'networkidle2' });

    // 네트워크 모니터링: 상세 조회 API 찾기
    const capturedRequests = [];
    page.on('request', req => {
        if (req.url().includes('view') || req.url().includes('ajax') || req.url().includes('detail')) {
            console.log(`📡 REQ: ${req.url()}`);
            capturedRequests.push({ url: req.url(), method: req.method(), postData: req.postData() });
        }
    });

    // 리스트 클릭
    // "장례식장" 탭에서 아무거나 클릭
    console.log('🖱️ 리스트 아이템 클릭 시도...');

    // 테이블 내의 a 태그 중 fn_view가 포함되거나 href가 #이 아닌 것
    await page.evaluate(() => {
        const links = document.querySelectorAll('.tbl_list tbody tr a');
        if (links.length > 0) {
            links[0].click();
        } else {
            console.log('❌ 리스트 링크를 못 찾음');
        }
    });

    await new Promise(r => setTimeout(r, 5000));

    // 요청 기록 저장
    fs.writeFileSync('esky_requests_dump.json', JSON.stringify(capturedRequests, null, 2));

    await browser.close();
})();
