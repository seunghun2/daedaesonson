
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🚀 e하늘 메인 진입 후 탐색...');
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1400, height: 900 });

    try {
        await page.goto('https://www.15774129.go.kr/portal/index.do', { waitUntil: 'networkidle2' });
        console.log('📸 메인 페이지 스크린샷...');
        await page.screenshot({ path: 'esky_main.png' });

        // 메뉴 찾기: "장사시설" 혹은 "전국장사시설"
        // 텍스트로 링크 찾기
        const linkSelector = await page.evaluate(() => {
            const links = Array.from(document.querySelectorAll('a'));
            const target = links.find(a => a.innerText.includes('장사시설검색') || a.innerText.includes('장사시설 찾기'));
            return target ? { href: target.href, text: target.innerText } : null;
        });

        if (linkSelector) {
            console.log(`🔗 찾은 링크: ${linkSelector.text} -> ${linkSelector.href}`);
            await page.goto(linkSelector.href, { waitUntil: 'networkidle2' });
        } else {
            console.log('⚠️ "장사시설검색" 링크를 못 찾음. URL 직접 시도.');
            // 알려진 서브 경로 시도
            await page.goto('https://www.ehaneul.go.kr/portal/index/fac/u_fac_list.do', { waitUntil: 'networkidle2' }); // URL 추측 수정
        }

        console.log('📸 리스트 페이지 스크린샷 (재시도)...');
        await page.screenshot({ path: 'esky_list_retry.png' });

        fs.writeFileSync('esky_list_retry.html', await page.content());
        console.log('💾 리스트 HTML 저장 완료');

    } catch (e) {
        console.error('❌ 분석 에러:', e);
    }

    await browser.close();
})();
