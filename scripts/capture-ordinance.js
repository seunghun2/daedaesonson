const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const testRegions = ['보은군', '가평군', '강릉시'];

async function captureOrdinanceTable() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = [];

    for (const region of testRegions) {
        console.log(`\n=== ${region} 처리 중 ===`);

        try {
            // 1. law.go.kr 자치법규 검색
            const searchUrl = `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(region + ' 장사시설 설치 및 운영 조례')}`;
            console.log('1. 검색 페이지 이동...');
            await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(3000);

            // 2. 별표/서식 탭 클릭 (이미 검색 결과 페이지에 있음)
            console.log('2. 별표/서식 탭 클릭...');
            const bylawTab = await page.$('text=별표/서식 >> nth=0');
            if (bylawTab) {
                await bylawTab.click();
                await page.waitForTimeout(2000);
            }

            // 3. [별표 3] 또는 사용료 관련 별표 찾기
            console.log('3. 사용료 별표 찾기...');
            const priceBylaw = await page.$('a:has-text("사용료")');

            if (priceBylaw) {
                const linkText = await priceBylaw.textContent();
                console.log(`   찾음: ${linkText}`);
                await priceBylaw.click();
                await page.waitForTimeout(3000);

                // 4. 새 창/팝업에서 스크린샷
                const pages = context.pages();
                const popupPage = pages[pages.length - 1];

                const screenshotPath = `data/ordinance_screenshots/${region}_price_table.png`;
                fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });
                await popupPage.screenshot({ path: screenshotPath, fullPage: true });
                console.log(`4. 스크린샷 저장: ${screenshotPath}`);

                results.push({
                    region,
                    status: 'success',
                    screenshot: screenshotPath
                });
            } else {
                console.log('   사용료 별표 없음');
                results.push({ region, status: 'no_price_bylaw' });
            }

        } catch (err) {
            console.log(`에러: ${err.message}`);
            results.push({ region, status: 'error', error: err.message });
        }
    }

    await browser.close();

    fs.writeFileSync('data/ordinance_capture_results.json', JSON.stringify(results, null, 2));
    console.log('\n=== 결과 ===');
    console.log(JSON.stringify(results, null, 2));
}

captureOrdinanceTable();
