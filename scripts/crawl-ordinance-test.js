const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const testRegions = ['보은군', '가평군', '강릉시', '거제시', '논산시'];

async function crawlOrdinance() {
    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = [];

    for (const region of testRegions) {
        console.log(`\n=== ${region} 조례 검색 ===`);

        try {
            // law.go.kr 자치법규 검색
            const searchUrl = `https://www.law.go.kr/ordinSc.do?menuId=3&subMenuId=27&tabMenuId=139&query=${encodeURIComponent(region + ' 장사시설')}`;
            await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });
            await page.waitForTimeout(2000);

            // 검색 결과에서 조례 클릭
            const ordinanceLink = await page.$(`text=${region} 장사시설 설치 및 운영 조례`);
            if (ordinanceLink) {
                await ordinanceLink.click();
                await page.waitForTimeout(2000);

                // 별표/서식 버튼 클릭
                const bylawBtn = await page.$('text=별표/서식');
                if (bylawBtn) {
                    await bylawBtn.click();
                    await page.waitForTimeout(1500);

                    // 별표 목록 가져오기
                    const bylawItems = await page.$$eval('a[onclick*="별표"]', els =>
                        els.map(el => ({ text: el.textContent, onclick: el.getAttribute('onclick') }))
                    );

                    console.log(`별표 목록: ${bylawItems.length}개 발견`);
                    bylawItems.forEach(item => console.log(`  - ${item.text}`));

                    results.push({
                        region,
                        status: 'success',
                        bylawCount: bylawItems.length,
                        bylaws: bylawItems.map(b => b.text)
                    });
                } else {
                    results.push({ region, status: 'no_bylaw_button' });
                }
            } else {
                results.push({ region, status: 'ordinance_not_found' });
            }
        } catch (err) {
            console.log(`에러: ${err.message}`);
            results.push({ region, status: 'error', error: err.message });
        }
    }

    await browser.close();

    // 결과 저장
    fs.writeFileSync('data/ordinance_test_results.json', JSON.stringify(results, null, 2));
    console.log('\n=== 결과 저장 완료 ===');
    console.log(JSON.stringify(results, null, 2));
}

crawlOrdinance();
