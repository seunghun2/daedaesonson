const playwright = require('playwright');

/**
 * 구글 검색 결과 디버깅 - 실제로 뭘 가져오는지 확인
 */

async function debugGoogleSearch() {
    const browser = await playwright.chromium.launch({
        headless: false,  // 브라우저 보이게
        args: ['--no-sandbox']
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    const searchQuery = '낙원추모공원 홈페이지';
    console.log(`🔍 검색: ${searchQuery}\n`);

    await page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchQuery)}&hl=ko`, {
        waitUntil: 'networkidle',
        timeout: 15000
    });

    await page.waitForTimeout(3000);

    // 모든 링크 추출
    const allLinks = await page.$$eval('a', elements =>
        elements.map(el => ({
            href: el.href,
            text: el.textContent?.trim().substring(0, 100) || ''
        }))
    );

    console.log(`총 ${allLinks.length}개 링크 발견\n`);

    // HTTP로 시작하는 링크만
    const httpLinks = allLinks.filter(link =>
        link.href.startsWith('http://') || link.href.startsWith('https://')
    );

    console.log(`HTTP 링크: ${httpLinks.length}개\n`);

    // 구글 내부 링크 제외
    const externalLinks = httpLinks.filter(link =>
        !link.href.includes('google.com') &&
        !link.href.includes('/search?')
    );

    console.log(`외부 링크: ${externalLinks.length}개\n`);

    // 처음 10개 출력
    console.log('📋 처음 10개 외부 링크:\n');
    externalLinks.slice(0, 10).forEach((link, i) => {
        console.log(`${i + 1}. ${link.href}`);
        console.log(`   텍스트: ${link.text}\n`);
    });

    // 5초 대기 후 닫기
    await page.waitForTimeout(5000);
    await browser.close();
}

debugGoogleSearch().catch(console.error);
