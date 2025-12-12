const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * E-SKY 사이트에서 시설 홈페이지 링크 가져오기
 */

async function getWebsiteFromESKY(facilityName) {
    const browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox']
    });

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            locale: 'ko-KR'
        });
        const page = await context.newPage();

        console.log(`  🔍 E-SKY에서 검색: ${facilityName}`);

        // E-SKY 시설 목록 페이지
        await page.goto('https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', {
            waitUntil: 'networkidle',
            timeout: 15000
        });

        await page.waitForTimeout(2000);

        // 검색창에 시설명 입력
        try {
            await page.fill('input[name="searchWord"], input[type="text"]', facilityName);
            await page.waitForTimeout(1000);

            // 검색 버튼 클릭 또는 엔터
            await page.press('input[name="searchWord"], input[type="text"]', 'Enter');
            await page.waitForTimeout(3000);

            // 첫 번째 검색 결과 클릭
            try {
                const firstResult = await page.$('a.searchResult, .facility-link, a[href*="facilityView"]');

                if (firstResult) {
                    await firstResult.click();
                    await page.waitForTimeout(3000);

                    // 홈페이지 버튼/링크 찾기
                    const homepageLink = await page.evaluate(() => {
                        // 여러 가능한 셀렉터 시도
                        const selectors = [
                            'a:has-text("홈페이지")',
                            'a[title*="홈페이지"]',
                            'button:has-text("홈페이지")',
                            '.homepage-link',
                            'a[href*="http"]:has-text("홈페이지")'
                        ];

                        for (const selector of selectors) {
                            try {
                                const element = document.querySelector(selector);
                                if (element && element.href) {
                                    return element.href;
                                }
                            } catch (e) {
                                continue;
                            }
                        }

                        return null;
                    });

                    if (homepageLink && !homepageLink.includes('e-haneul.go.kr')) {
                        console.log(`  ✅ 찾음: ${homepageLink}`);
                        await browser.close();
                        return homepageLink;
                    }
                }
            } catch (error) {
                console.log(`  ❌ 검색 결과 없음: ${error.message}`);
            }

            await browser.close();
            return null;

        } catch (error) {
            console.error(`  ❌ 오류: ${error.message}`);
            await browser.close();
            return null;
        }
    }

async function testESKYCrawling() {
        const inputFile = path.join(__dirname, '..', 'extracted_facility_info.json');
        const facilities = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

        console.log('🌐 E-SKY에서 홈페이지 추출 테스트 (1~5개)\n');

        const first5 = facilities.slice(0, 5);
        const results = [];

        for (let i = 0; i < first5.length; i++) {
            const facility = first5[i];
            console.log(`[${i + 1}/5] ${facility.name}`);

            const website = await getWebsiteFromESKY(facility.name);

            results.push({
                no: facility.no,
                name: facility.name,
                website: website || 'NOT FOUND'
            });

            // 딜레이
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        console.log('\n' + '='.repeat(80));
        console.log('📊 결과:\n');
        results.forEach(r => {
            console.log(`${r.no}. ${r.name}`);
            console.log(`   ${r.website}\n`);
        });

        const outputPath = path.join(__dirname, '..', 'esky_test_results.json');
        fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
        console.log(`💾 저장: ${outputPath}`);
    }

    testESKYCrawling()
        .then(() => console.log('\n✅ 완료!'))
        .catch(error => {
            console.error('❌ 오류:', error);
            process.exit(1);
        });
