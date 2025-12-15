const playwright = require('playwright');
const fs = require('fs');
const path = require('path');

/**
 * E-SKY 사이트에서 시설 홈페이지 링크 가져오기 (15774129.go.kr)
 */

async function getWebsiteFromESKY(facilityName) {
    const browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox']
    });

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 720 },
            locale: 'ko-KR'
        });
        const page = await context.newPage();

        console.log(`  🔍 E-SKY에서 검색: ${facilityName}`);

        // 1. E-SKY 시설 목록 페이지로 이동
        await page.goto('https://15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', {
            waitUntil: 'networkidle',
            timeout: 30000
        });

        // 2. 검색창에 시설명 입력
        // 검색창 찾기 (input[name="searchKeyword"] 또는 유사한 것)
        const searchInput = await page.$('input[name="searchKeyword"], input[type="text"]');
        if (searchInput) {
            await searchInput.fill(facilityName);
            await page.keyboard.press('Enter');

            // 검색 결과 로딩 대기
            await page.waitForTimeout(2000);
            await page.waitForLoadState('networkidle');
        } else {
            console.log('  ⚠️ 검색창을 찾을 수 없습니다.');
            await browser.close();
            return null;
        }

        // 3. 첫 번째 검색 결과 클릭
        // 보통 검색 결과는 테이블이나 리스트 형태. 링크를 찾아서 클릭.
        // .content_list a, table a 등으로 추정
        try {
            // "상세보기" 또는 시설명 링크 찾기
            const firstResult = await page.$('table tbody tr td a, .content_list a, a[onclick*="view"], a[href*="view"]');

            if (firstResult) {
                await firstResult.click();
                await page.waitForTimeout(2000);
                await page.waitForLoadState('networkidle');

                // 4. 상세 페이지에서 홈페이지 링크 찾기
                const homepageUrl = await page.evaluate(() => {
                    // "홈페이지" 레이블 옆의 링크 찾기 또는 텍스트가 url인 것 찾기
                    const links = Array.from(document.querySelectorAll('a'));

                    for (const a of links) {
                        const href = a.href;
                        const text = a.innerText.trim();

                        // http로 시작하고 내부 링크가 아닌 것
                        if (href && href.startsWith('http') && !href.includes('15774129.go.kr') && !href.includes('javascript')) {
                            // "홈페이지" 관련 텍스트가 근처에 있거나, 링크 텍스트 자체가 '홈페이지'인 경우
                            // 또는 상세 정보 테이블 안에 있는 링크
                            return href;
                        }
                    }
                    return null;
                });

                if (homepageUrl) {
                    console.log(`  ✅ 찾음: ${homepageUrl}`);
                    await browser.close();
                    return homepageUrl;
                } else {
                    console.log('  ⚠️ 홈페이지 링크 없음');
                }
            } else {
                console.log('  ⚠️ 검색 결과 없음');
            }
        } catch (e) {
            console.log(`  ❌ 상세 페이지 이동 실패: ${e.message}`);
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
    // 파일이 없으면 빈 배열
    if (!fs.existsSync(inputFile)) {
        console.error('파일이 없습니다:', inputFile);
        return;
    }

    const facilities = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

    console.log('🌐 E-SKY 홈페이지 추출 테스트 (1~5번 시설)\n');

    // 처음 5개만 테스트
    const testBatch = facilities.slice(0, 5);
    const results = [];

    for (let i = 0; i < testBatch.length; i++) {
        const facility = testBatch[i];
        console.log(`[${i + 1}/5] ${facility.name}`);

        const website = await getWebsiteFromESKY(facility.name);

        results.push({
            no: facility.no,
            name: facility.name,
            website: website || 'NOT FOUND'
        });

        // 딜레이 (서버 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 3000));
    }

    console.log('\n' + '='.repeat(80));
    console.log('📊 테스트 결과:\n');
    results.forEach(r => {
        console.log(`${r.no}. ${r.name}`);
        console.log(`   ${r.website}\n`);
    });
}

if (require.main === module) {
    testESKYCrawling()
        .then(() => console.log('\n✅ 완료!'))
        .catch(error => {
            console.error('❌ 오류:', error);
            process.exit(1);
        });
}
