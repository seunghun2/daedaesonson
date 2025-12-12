/**
 * 🔍 사이트 구조 스카우트 (첫장 + 명당가)
 * 
 * 목적: 각 사이트의 HTML 구조를 파악하여 크롤러 작성
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function scoutSite(url, name) {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🔍 [${name}] 스카우팅 시작: ${url}`);
    console.log('='.repeat(50));

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

        // 스크린샷
        await page.screenshot({ path: `${name}_screenshot.png`, fullPage: true });
        console.log(`📸 스크린샷 저장: ${name}_screenshot.png`);

        // 페이지 정보 수집
        const pageInfo = await page.evaluate(() => {
            return {
                title: document.title,
                url: window.location.href,

                // 주요 링크
                links: Array.from(document.querySelectorAll('a')).map(a => ({
                    text: a.innerText.trim().substring(0, 50),
                    href: a.href,
                    class: a.className
                })).filter(l => l.text).slice(0, 30),

                // 잠재적 시설 카드/아이템
                possibleCards: {
                    '.card': document.querySelectorAll('.card').length,
                    '.item': document.querySelectorAll('.item').length,
                    '.list-item': document.querySelectorAll('.list-item').length,
                    '.facility': document.querySelectorAll('.facility').length,
                    'article': document.querySelectorAll('article').length,
                    '[data-id]': document.querySelectorAll('[data-id]').length,
                },

                // 주요 텍스트 패턴
                textPatterns: {
                    hasPrice: document.body.innerHTML.includes('만원') || document.body.innerHTML.includes('원'),
                    hasAddress: document.body.innerHTML.includes('주소') || document.body.innerHTML.includes('위치'),
                    hasPhone: document.body.innerHTML.includes('전화') || document.body.innerHTML.includes('연락'),
                },

                // Form 요소
                forms: Array.from(document.querySelectorAll('form')).map(f => ({
                    action: f.action,
                    method: f.method,
                    inputs: f.querySelectorAll('input').length
                })),

                // 버튼
                buttons: Array.from(document.querySelectorAll('button')).map(b =>
                    b.innerText.trim()
                ).filter(t => t).slice(0, 20)
            };
        });

        console.log('\n📊 페이지 분석 결과:');
        console.log('제목:', pageInfo.title);
        console.log('URL:', pageInfo.url);
        console.log('\n🔗 주요 링크 (상위 10개):');
        pageInfo.links.slice(0, 10).forEach(link => {
            console.log(`  - ${link.text} (${link.href})`);
        });

        console.log('\n📦 잠재적 시설 카드:');
        Object.entries(pageInfo.possibleCards).forEach(([selector, count]) => {
            if (count > 0) {
                console.log(`  ${selector}: ${count}개`);
            }
        });

        console.log('\n🔍 텍스트 패턴:');
        console.log('  가격 정보:', pageInfo.textPatterns.hasPrice ? '✅' : '❌');
        console.log('  주소 정보:', pageInfo.textPatterns.hasAddress ? '✅' : '❌');
        console.log('  전화번호:', pageInfo.textPatterns.hasPhone ? '✅' : '❌');

        console.log('\n🎯 주요 버튼:');
        pageInfo.buttons.forEach(btn => {
            console.log(`  - ${btn}`);
        });

        // JSON 저장
        fs.writeFileSync(
            `${name}_structure.json`,
            JSON.stringify(pageInfo, null, 2)
        );
        console.log(`\n💾 구조 정보 저장: ${name}_structure.json`);

        // 30초 대기 (수동 탐색)
        console.log('\n⏳ 30초 대기 중... (수동으로 페이지 탐색 가능)');
        await new Promise(r => setTimeout(r, 10000)); // 30초는 너무 길어서 10초로 단축

    } catch (error) {
        console.error(`❌ [${name}] 오류:`, error.message);
    } finally {
        await browser.close();
    }
}

(async () => {
    console.log('🚀 사이트 구조 스카우팅 시작\n');

    // 1. 첫장
    await scoutSite('https://apply.cheotjang.com/main', 'cheotjang');

    // 2. 명당가
    await scoutSite('https://myungdangga.co.kr/', 'myungdangga');

    console.log('\n✅ 모든 스카우팅 완료!');
})();
