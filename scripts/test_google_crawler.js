const playwright = require('playwright');

async function testGoogleSearch() {
    const browser = await playwright.chromium.launch({
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 },
        locale: 'ko-KR'
    });

    const page = await context.newPage();

    try {
        const searchQuery = '(재)낙원추모공원 홈페이지';
        console.log(`🔍 구글 검색: "${searchQuery}"`);

        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=ko`, {
            waitUntil: 'networkidle',
            timeout: 15000
        });

        console.log('✅ 페이지 로드 완료');
        await page.waitForTimeout(3000);

        // div#search 대기
        const searchDiv = await page.$('div#search');
        console.log(`📦 div#search 존재: ${!!searchDiv}`);

        // 페이지 HTML 길이 확인
        const html = await page.content();
        console.log(`📄 HTML 길이: ${html.length}자`);

        // h3 개수 확인
        const h3Count = await page.evaluate(() => document.querySelectorAll('h3').length);
        console.log(`📌 h3 태그 개수: ${h3Count}`);

        // 검색 결과 링크 직접 확인
        const results = await page.evaluate(() => {
            const found = [];

            // 모든 h3를 포함한 a 태그 찾기
            document.querySelectorAll('a').forEach(link => {
                const h3 = link.querySelector('h3');
                if (h3) {
                    found.push({
                        href: link.href,
                        text: h3.textContent
                    });
                }
            });

            return found;
        });

        console.log(`\n🔎 발견된 검색 결과: ${results.length}개`);
        results.forEach((r, i) => {
            console.log(`   ${i + 1}. ${r.text}`);
            console.log(`      ${r.href}`);
        });

        // 5초 대기 후 종료
        console.log('\n⏳ 5초 후 브라우저 종료...');
        await page.waitForTimeout(5000);

    } catch (error) {
        console.error('❌ 오류:', error.message);
    } finally {
        await browser.close();
    }
}

testGoogleSearch();
