const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

/**
 * 의심스러운 URL (중개사이트) 203개 재검색
 * 중개사이트 도메인을 제외하고 공식 홈페이지 찾기
 */

const CONFIG = {
    SEARCH_DELAY: 2000,
    PAGE_LOAD_TIMEOUT: 12000,
    INPUT_FILE: path.join(__dirname, '..', 'data', 'facility_urls.json'),
    OUTPUT_FILE: path.join(__dirname, '..', 'data', 'facility_urls_fixed.json'),
};

// 중개 사이트 도메인 (더 철저하게)
const BAD_DOMAINS = [
    'goifuneral.co.kr',
    'myungdangga.co.kr',
    'ch-funeralportal.co.kr',
    'gangwon-portal.co.kr',
    'placeview.co.kr',
    'funeralblog.co.kr',
    '15774129.go.kr',
    'linktoplace.com',
    'cafe24.com',
    'dmonster',
    'ciff.kr',
    'saeob.com',
    'rightfuneral.co.kr',
    'bugosms.com',
    '114.co.kr',
    'bizno.net',
    'worldorgs.com',
    'chosearch.com',
    // 검색/SNS
    'google.com', 'naver.com', 'daum.net', 'kakao.com',
    'youtube.com', 'facebook.com', 'instagram.com', 'twitter.com',
    'blog.naver.com', 'cafe.naver.com', 'tistory.com',
    'wikipedia.org', 'namu.wiki',
    'duckduckgo.com',
    // 취업사이트
    'saramin.co.kr', 'jobkorea.co.kr', 'incruit.com', 'wanted.co.kr',
    // AI/기타
    'duck.ai', 'duckduckgo.com',
    // 뉴스
    'chosun.com', 'joins.com', 'donga.com', 'hani.co.kr', 'khan.co.kr',
    // 기타
    'amazon.com', 'ebay.com', 'alibaba.com',
    'daangn.com', 'karrot.com',  // 당근마켓
    'substack.com',  // 블로그
    'gyeongsang-portal.co.kr', 'honam-portal.co.kr', 'chungcheong-portal.co.kr',  // 지역 포털
    'reddit.com', 'quora.com', 'medium.com',  // 커뮤니티
    'nate.com', 'zum.com',  // 포털
];

class UrlRefiner {
    constructor() {
        this.browser = null;
        this.context = null;
    }

    async init() {
        this.browser = await playwright.chromium.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            viewport: { width: 1280, height: 800 },
            locale: 'ko-KR'
        });
    }

    async close() {
        if (this.browser) await this.browser.close();
    }

    isBadUrl(url) {
        if (!url) return true;
        const lower = url.toLowerCase();
        return BAD_DOMAINS.some(bad => lower.includes(bad));
    }

    async searchUrl(facilityName) {
        const page = await this.context.newPage();
        let bestUrl = null;
        let bestScore = -1;

        try {
            const searchQuery = `${facilityName} 공식 홈페이지`;

            await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&kl=kr-kr`, {
                waitUntil: 'domcontentloaded',
                timeout: CONFIG.PAGE_LOAD_TIMEOUT
            });

            await page.waitForTimeout(1500);

            const links = await page.evaluate((excluded) => {
                const results = [];

                document.querySelectorAll('a[data-testid="result-title-a"], article a[href^="http"]').forEach(link => {
                    const href = link.href;
                    const text = link.textContent?.trim() || '';
                    if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
                        try {
                            const domain = new URL(href).hostname.toLowerCase();
                            const isExcluded = excluded.some(ex => domain.includes(ex));
                            if (!isExcluded && !results.find(r => r.href === href)) {
                                results.push({ href, text, domain });
                            }
                        } catch (e) { }
                    }
                });

                if (results.length === 0) {
                    document.querySelectorAll('a[href^="http"]').forEach(link => {
                        const href = link.href;
                        const text = link.textContent?.trim() || '';
                        try {
                            const domain = new URL(href).hostname.toLowerCase();
                            const isExcluded = excluded.some(ex => domain.includes(ex));
                            if (!isExcluded && !results.find(r => r.href === href)) {
                                results.push({ href, text, domain });
                            }
                        } catch (e) { }
                    });
                }

                return results;
            }, BAD_DOMAINS);

            for (const link of links) {
                const score = this.calculateScore(link, facilityName);
                if (score > bestScore) {
                    bestScore = score;
                    bestUrl = link.href;
                }
            }

            if (bestUrl) {
                console.log(`  ✅ ${links.length}개 후보 → ${new URL(bestUrl).hostname}`);
            } else {
                console.log(`  ⚠️ 공식 홈페이지 없음`);
            }

        } catch (error) {
            console.log(`  ❌ 오류: ${error.message.substring(0, 30)}`);
        } finally {
            await page.close();
        }

        return bestUrl;
    }

    calculateScore(link, facilityName) {
        let score = 0;
        const text = (link.text || '').toLowerCase();
        const facilityLower = facilityName.toLowerCase().replace(/[\(\)（）재단법인]/g, '');

        const words = facilityLower.split(/\s+/).filter(w => w.length >= 2);
        for (const word of words) {
            if (text.includes(word)) score += 20;
            if (link.domain && link.domain.includes(word.replace(/공원|묘원|추모/g, ''))) score += 40;
        }

        if (text.includes('홈페이지') || text.includes('공식')) score += 30;
        if (text.includes('추모') || text.includes('봉안') || text.includes('납골')) score += 25;

        // 정부/공공기관 도메인 가점
        if (link.domain.endsWith('.go.kr') || link.domain.endsWith('.or.kr')) score += 15;

        try {
            const url = new URL(link.href);
            if (url.pathname === '/' || url.pathname === '') score += 10;
        } catch (e) { }

        return score;
    }

    async run() {
        const data = JSON.parse(fs.readFileSync(CONFIG.INPUT_FILE, 'utf-8'));

        // 의심스러운 URL 필터링
        const suspicious = data.filter(d => this.isBadUrl(d.url));
        const good = data.filter(d => !this.isBadUrl(d.url));

        console.log(`\n${'='.repeat(60)}`);
        console.log(`🔄 의심스러운 URL 재검색`);
        console.log(`   대상: ${suspicious.length}개`);
        console.log(`   이미 양호: ${good.length}개`);
        console.log(`${'='.repeat(60)}\n`);

        await this.init();

        let improved = 0;
        let stillBad = 0;

        for (let i = 0; i < suspicious.length; i++) {
            const facility = suspicious[i];
            process.stdout.write(`[${i + 1}/${suspicious.length}] ${facility.name.substring(0, 20).padEnd(20)} `);

            const newUrl = await this.searchUrl(facility.name);

            if (newUrl && !this.isBadUrl(newUrl)) {
                facility.url = newUrl;
                facility.urlFixed = true;
                improved++;
            } else {
                facility.urlFixed = false;
                stillBad++;
            }

            // 매 10개마다 저장
            if ((i + 1) % 10 === 0) {
                const result = [...good, ...suspicious];
                fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(result, null, 2));
            }

            await new Promise(resolve => setTimeout(resolve, CONFIG.SEARCH_DELAY));
        }

        await this.close();

        // 최종 저장
        const result = [...good, ...suspicious];
        fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(result, null, 2));

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ 재검색 완료!`);
        console.log(`   개선됨: ${improved}개`);
        console.log(`   여전히 없음: ${stillBad}개`);
        console.log(`   저장: ${CONFIG.OUTPUT_FILE}`);
        console.log(`${'='.repeat(60)}\n`);
    }
}

if (require.main === module) {
    const refiner = new UrlRefiner();
    refiner.run().catch(console.error);
}
