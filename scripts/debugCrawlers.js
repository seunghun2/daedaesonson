
const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    console.log('🔍 크롤러 디버깅 시작...');
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Mac 기본 크롬
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // 1. 첫장 (Cheotjang)
    try {
        console.log('👉 [첫장] 접속 중...');
        // 실제 리스트가 로딩될 것으로 예상되는 URL
        await page.goto('https://apply.cheotjang.com/burial_v_1_0_0', { waitUntil: 'networkidle2' });

        // 데이터 로딩 대기 (CSR일 경우)
        await new Promise(r => setTimeout(r, 3000));

        const cheotjangHtml = await page.content();
        fs.writeFileSync('cheotjang_dump.html', cheotjangHtml);
        console.log('✅ [첫장] HTML 저장 완료: cheotjang_dump.html');

        // 스크린샷
        await page.screenshot({ path: 'cheotjang_debug.png' });

    } catch (e) {
        console.error('❌ [첫장] 실패:', e);
    }

    // 2. 명당가 (Myungdangga)
    try {
        console.log('👉 [명당가] 접속 중...');
        // 명당가는 메인에서 리스트를 찾아야 함
        await page.goto('https://myungdangga.co.kr/search', { waitUntil: 'networkidle2' });
        // 만약 search 페이지가 없으면 메인으로 리다이렉트 될 것임

        await new Promise(r => setTimeout(r, 3000));

        const myungdanggaHtml = await page.content();
        fs.writeFileSync('myungdangga_dump.html', myungdanggaHtml);
        console.log('✅ [명당가] HTML 저장 완료: myungdangga_dump.html');

        await page.screenshot({ path: 'myungdangga_debug.png' });

    } catch (e) {
        console.error('❌ [명당가] 실패:', e);
    }

    await browser.close();
    console.log('🏁 디버깅 완료.');
})();
