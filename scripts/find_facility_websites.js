const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

/**
 * 시설 홈페이지를 크롤링하여 찾는 스크립트
 * 네이버, 구글 검색을 통해 각 시설의 공식 홈페이지를 찾습니다.
 */

async function searchFacilityWebsite(facilityName, address) {
    const browser = await playwright.chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'ko-KR'
        });
        const page = await context.newPage();

        // 구글 검색
        const searchQuery = `${facilityName} 홈페이지 site:`;
        console.log(`🔍 Google 검색: ${searchQuery}`);

        await page.goto(`https://www.google.com/search?q=${encodeURIComponent(facilityName + ' 홈페이지')}&hl=ko`, {
            waitUntil: 'networkidle',
            timeout: 15000
        });

        await page.waitForTimeout(3000);

        // 웹사이트 링크를 찾기
        let website = null;

        try {
            // 검색 결과에서 링크 추출 (더 구체적인 셀렉터 사용)
            const links = await page.evaluate(() => {
                const results = [];
                // 구글 검색 결과 링크 선택
                const searchResults = document.querySelectorAll('div.yuRUbf > a, a[jsname="UWckNb"]');

                searchResults.forEach(link => {
                    if (link.href) {
                        results.push({
                            href: link.href,
                            text: link.textContent || ''
                        });
                    }
                });

                return results;
            });

            console.log(`  발견된 링크: ${links.length}개`);

            // 제외할 도메인 목록
            const excludedDomains = [
                'google.com', 'youtube.com', 'facebook.com', 'instagram.com',
                'twitter.com', 'naver.com', 'daum.net', 'kakao.com',
                'blog.', 'cafe.', 'post.', 'news.',
                'saramin.co.kr', 'jobkorea.co.kr', 'incruit.com', 'wanted.co.kr',
                'ohmynews.com', 'chosun.com', 'joins.com', 'donga.com',
                'grandculture.net', 'wikipedia.org', 'namu.wiki',
                'linktoplace.com', 'placeview.co.kr', 'bizno.net',
                'life114.co.kr', 'hurian.com', 'webcenter.co.kr',
                'samsunghospital.com', 'peace11.com', 'ywfmc.or.kr',
                'newsfreezone.co.kr', 'kmpa.ai.kr', 'gijang.go.kr',
                'gg.go.kr', 'seoul.go.kr', 'ii.re.kr'
            ];

            // 유효한 링크 찾기
            for (const link of links) {
                const href = link.href.toLowerCase();

                // HTTP/HTTPS로 시작하는지 확인
                if (!href.startsWith('http://') && !href.startsWith('https://')) {
                    continue;
                }

                // 제외 도메인 체크
                const isExcluded = excludedDomains.some(domain => href.includes(domain));
                if (isExcluded) {
                    continue;
                }

                // 첫 번째 유효한 링크 사용
                website = link.href;
                break;
            }

        } catch (error) {
            console.error(`  검색 오류: ${error.message}`);
        }

        await browser.close();
        return website;

    } catch (error) {
        console.error(`  브라우저 오류: ${error.message}`);
        await browser.close();
        return null;
    }
}

async function enrichFacilitiesWithWebsites() {
    const inputFile = path.join(__dirname, '..', 'extracted_facility_info.json');
    const outputFile = path.join(__dirname, '..', 'extracted_facility_info_with_websites.json');

    const facilities = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

    console.log(`🌐 Searching websites for ${facilities.length} facilities...`);
    console.log('This may take a while...\n');

    const enrichedFacilities = [];

    for (let i = 0; i < facilities.length; i++) {
        const facility = facilities[i];
        console.log(`[${i + 1}/${facilities.length}] Processing: ${facility.name}`);

        if (!facility.website) {
            // 웹사이트가 없으면 검색
            const website = await searchFacilityWebsite(facility.name, facility.address);

            if (website) {
                facility.website = website;
                console.log(`  ✓ Found website: ${website}`);
            } else {
                console.log(`  ⚠️  No website found`);
            }

            // 요청 사이에 딜레이 (서버 부하 방지)
            await new Promise(resolve => setTimeout(resolve, 3000));
        } else {
            console.log(`  ✓ Website already exists: ${facility.website}`);
        }

        enrichedFacilities.push(facility);

        // 중간 저장 (5개마다)
        if ((i + 1) % 5 === 0) {
            fs.writeFileSync(outputFile, JSON.stringify(enrichedFacilities, null, 2), 'utf-8');
            console.log(`  💾 Progress saved (${i + 1}/${facilities.length})\n`);
        }
    }

    // 최종 저장
    fs.writeFileSync(outputFile, JSON.stringify(enrichedFacilities, null, 2), 'utf-8');
    fs.writeFileSync(inputFile, JSON.stringify(enrichedFacilities, null, 2), 'utf-8'); // 원본도 업데이트

    console.log(`\n✅ Completed! Saved to:`);
    console.log(`  - ${outputFile}`);
    console.log(`  - ${inputFile} (updated)`);

    // 통계
    const withWebsite = enrichedFacilities.filter(f => f.website).length;
    console.log(`\n📊 Statistics:`);
    console.log(`  Total facilities: ${enrichedFacilities.length}`);
    console.log(`  With website: ${withWebsite} (${Math.round(withWebsite / enrichedFacilities.length * 100)}%)`);
    console.log(`  Without website: ${enrichedFacilities.length - withWebsite}`);

    return enrichedFacilities;
}

if (require.main === module) {
    enrichFacilitiesWithWebsites()
        .then(() => console.log('\n🎉 All done!'))
        .catch(error => {
            console.error('Error:', error);
            process.exit(1);
        });
}

module.exports = { searchFacilityWebsite, enrichFacilitiesWithWebsites };
