const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

/**
 * 시설 URL만 빠르게 수집하는 크롤러 (1단계)
 * 
 * 출력: 고유아이디, 시설명, URL 리스트
 * 
 * 사용법:
 *   node scripts/crawl_facility_urls.js [시작번호] [끝번호]
 *   예: node scripts/crawl_facility_urls.js 1 100
 * 
 * 이어서 하기:
 *   말만 하면 됨 - 자동으로 마지막 진행 위치부터 시작
 */

const CONFIG = {
    SEARCH_DELAY: 2000,          // 검색 간 딜레이 (ms)
    PAGE_LOAD_TIMEOUT: 12000,    // 페이지 로드 타임아웃
    OUTPUT_FILE: path.join(__dirname, '..', 'data', 'facility_urls.json'),
    PROGRESS_FILE: path.join(__dirname, '..', 'data', 'url_crawl_progress.json')
};

// 제외할 도메인 (SNS, 검색엔진, 블로그, 중개 사이트 등)
const EXCLUDED_DOMAINS = [
    'google.com', 'google.co.kr', 'youtube.com', 'facebook.com', 'instagram.com',
    'twitter.com', 'naver.com', 'blog.naver.com', 'cafe.naver.com',
    'daum.net', 'kakao.com', 'tistory.com',
    'wikipedia.org', 'namu.wiki',
    'saramin.co.kr', 'jobkorea.co.kr',
    'bizno.net', 'map.naver.com', 'place.naver.com', 'map.kakao.com',
    'duckduckgo.com',
    // 중개/리스트 사이트 제외 (공식 홈페이지만 찾기)
    'saeob.com', 'bugosms.com', '114.co.kr', 'gyeongsang-portal.co.kr',
    'rightfuneral.co.kr'
];

class UrlCrawler {
    constructor() {
        this.browser = null;
        this.context = null;
        this.results = this.loadExistingResults();
        this.progress = this.loadProgress();
    }

    loadExistingResults() {
        try {
            if (fs.existsSync(CONFIG.OUTPUT_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.OUTPUT_FILE, 'utf-8'));
                console.log(`📂 기존 결과 불러옴: ${data.length}개`);
                return data;
            }
        } catch (e) { }
        return [];
    }

    loadProgress() {
        try {
            if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf-8'));
                console.log(`📍 마지막 진행: ${data.lastIndex + 1}번`);
                return data;
            }
        } catch (e) { }
        return { lastIndex: -1 };
    }

    saveProgress(index) {
        this.progress.lastIndex = index;
        this.progress.lastUpdated = new Date().toISOString();
        fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
    }

    saveResults() {
        fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(this.results, null, 2), 'utf-8');
    }

    async init() {
        this.browser = await playwright.chromium.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1280, height: 800 },
            locale: 'ko-KR'
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * DuckDuckGo 검색으로 URL 찾기
     */
    async searchUrl(facilityName) {
        const page = await this.context.newPage();
        let bestUrl = null;

        try {
            const searchQuery = `${facilityName} 홈페이지`;

            await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&kl=kr-kr`, {
                waitUntil: 'domcontentloaded',
                timeout: CONFIG.PAGE_LOAD_TIMEOUT
            });

            await page.waitForTimeout(1500);

            // 링크 추출
            const links = await page.evaluate((excluded) => {
                const results = [];

                // DuckDuckGo 결과 링크
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

                // 백업: 모든 외부 링크
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
            }, EXCLUDED_DOMAINS);

            if (links.length > 0) {
                // 점수 계산해서 최고 점수 URL 선택
                let bestScore = -1;
                for (const link of links) {
                    const score = this.calculateScore(link, facilityName);
                    if (score > bestScore) {
                        bestScore = score;
                        bestUrl = link.href;
                    }
                }
                console.log(`  ✅ ${links.length}개 후보 → ${new URL(bestUrl).hostname}`);
            } else {
                console.log(`  ⚠️ URL 없음`);
            }

        } catch (error) {
            console.log(`  ❌ 오류: ${error.message.substring(0, 40)}`);
        } finally {
            await page.close();
        }

        return bestUrl;
    }

    calculateScore(link, facilityName) {
        let score = 0;
        const text = (link.text || '').toLowerCase();
        const facilityLower = facilityName.toLowerCase().replace(/[\(\)（）재단법인]/g, '');

        // 시설명 일부 포함
        const words = facilityLower.split(/\s+/).filter(w => w.length >= 2);
        for (const word of words) {
            if (text.includes(word)) score += 20;
            if (link.domain && link.domain.includes(word.replace(/공원|묘원/g, ''))) score += 30;
        }

        // 키워드
        if (text.includes('홈페이지') || text.includes('공식')) score += 25;
        if (text.includes('추모') || text.includes('봉안') || text.includes('납골')) score += 20;

        // 루트 페이지 가점
        try {
            const url = new URL(link.href);
            if (url.pathname === '/' || url.pathname === '') score += 15;
        } catch (e) { }

        return score;
    }

    async run(startIndex = 1, endIndex = null) {
        const inputFile = path.join(__dirname, '..', 'extracted_facility_info.json');
        const facilities = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

        const end = endIndex || facilities.length;
        const actualStart = startIndex - 1; // 1-indexed to 0-indexed

        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 URL 수집 시작: ${actualStart + 1}번 ~ ${end}번`);
        console.log(`   총 ${end - actualStart}개 시설`);
        console.log(`${'='.repeat(60)}\n`);

        await this.init();

        for (let i = actualStart; i < end; i++) {
            const facility = facilities[i];

            // 이미 완료된 시설 스킵
            if (this.results.find(r => r.no === facility.no)) {
                continue;
            }

            process.stdout.write(`[${i + 1}/${end}] ${facility.name.substring(0, 20).padEnd(20)} `);

            const url = await this.searchUrl(facility.name);

            this.results.push({
                no: facility.no,
                name: facility.name,
                url: url
            });

            // 매번 저장 (안전)
            this.saveResults();
            this.saveProgress(i);

            await new Promise(resolve => setTimeout(resolve, CONFIG.SEARCH_DELAY));
        }

        await this.close();

        // 통계
        const withUrl = this.results.filter(r => r.url).length;
        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ 완료!`);
        console.log(`   총 시설: ${this.results.length}개`);
        console.log(`   URL 발견: ${withUrl}개 (${Math.round(withUrl / this.results.length * 100)}%)`);
        console.log(`   URL 없음: ${this.results.length - withUrl}개`);
        console.log(`   저장: ${CONFIG.OUTPUT_FILE}`);
        console.log(`${'='.repeat(60)}\n`);
    }
}

// 실행
if (require.main === module) {
    const args = process.argv.slice(2);
    const startIndex = parseInt(args[0]) || 1;
    const endIndex = args[1] ? parseInt(args[1]) : null;

    const crawler = new UrlCrawler();
    crawler.run(startIndex, endIndex)
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { UrlCrawler };
