const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const testRegions = ['보은군'];

async function downloadOrdinanceHWP() {
    const downloadPath = path.join(__dirname, '../data/ordinance_hwp');
    fs.mkdirSync(downloadPath, { recursive: true });

    const browser = await chromium.launch({ headless: false });
    const context = await browser.newContext({
        acceptDownloads: true
    });
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

            // 2. 별표/서식 탭 클릭
            console.log('2. 별표/서식 탭 클릭...');
            const bylawTab = await page.$('text=별표/서식 >> nth=0');
            if (bylawTab) {
                await bylawTab.click();
                await page.waitForTimeout(2000);
            }

            // 3. 사용료 관련 별표 찾기 (정확한 [별표 X] 형식)
            console.log('3. 사용료 별표 찾기...');
            const bylawLinks = await page.$$('a:has-text("[별표"):has-text("사용료")');

            // 중복 제거 (텍스트 기준)
            const seen = new Set();
            const uniqueLinks = [];
            for (const link of bylawLinks) {
                const text = await link.textContent();
                if (!seen.has(text.trim())) {
                    seen.add(text.trim());
                    uniqueLinks.push({ link, text: text.trim() });
                }
            }

            console.log(`   고유 별표: ${uniqueLinks.length}개`);

            const regionDownloads = [];

            for (let i = 0; i < uniqueLinks.length; i++) {
                const { link, text } = uniqueLinks[i];
                console.log(`   ${i + 1}. ${text}`);

                // 별표 클릭 → 팝업 열기
                const [popup] = await Promise.all([
                    context.waitForEvent('page', { timeout: 10000 }).catch(() => null),
                    link.click()
                ]);

                if (popup) {
                    await popup.waitForTimeout(3000);

                    // 팝업에서 HWP 다운로드 버튼 찾기
                    const hwpBtn = await popup.$('a:has-text("HWP"), button:has-text("HWP"), a[href*=".hwp"]');

                    if (hwpBtn) {
                        console.log(`      HWP 버튼 발견!`);
                        const [download] = await Promise.all([
                            popup.waitForEvent('download', { timeout: 10000 }).catch(() => null),
                            hwpBtn.click()
                        ]);

                        if (download) {
                            const fileName = `${region}_${i + 1}.hwp`;
                            const filePath = path.join(downloadPath, fileName);
                            await download.saveAs(filePath);
                            console.log(`      저장: ${fileName}`);
                            regionDownloads.push({ text, file: fileName });
                        }
                    } else {
                        // HWP 버튼 없으면 스크린샷 저장
                        const screenshotPath = path.join(downloadPath, `${region}_${i + 1}.png`);
                        await popup.screenshot({ path: screenshotPath, fullPage: true });
                        console.log(`      HWP 없음 → 스크린샷: ${region}_${i + 1}.png`);
                        regionDownloads.push({ text, file: `${region}_${i + 1}.png`, type: 'screenshot' });
                    }

                    await popup.close();
                }
            }

            results.push({
                region,
                status: regionDownloads.length > 0 ? 'success' : 'no_downloads',
                downloads: regionDownloads
            });

        } catch (err) {
            console.log(`에러: ${err.message}`);
            results.push({ region, status: 'error', error: err.message });
        }
    }

    await browser.close();

    fs.writeFileSync('data/ordinance_download_results.json', JSON.stringify(results, null, 2));
    console.log('\n=== 결과 ===');
    console.log(JSON.stringify(results, null, 2));
}

downloadOrdinanceHWP();
