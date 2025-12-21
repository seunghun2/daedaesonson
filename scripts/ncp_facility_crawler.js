const fs = require('fs');
const path = require('path');
const playwright = require('playwright');
const https = require('https');
const http = require('http');

/**
 * 구글 기반 시설 크롤러
 * 
 * 작업 내용:
 * 1. 구글 검색으로 시설 웹사이트 찾기 (1페이지 전체 스캔)
 * 2. 찾은 웹사이트 내 모든 페이지 탐색
 * 3. 가격 정보 추출 및 저장
 * 4. 이미지 다운로드 및 저장
 * 
 * 사용법:
 *   node scripts/ncp_facility_crawler.js [시작번호] [끝번호]
 *   예: node scripts/ncp_facility_crawler.js 3 10
 *       (3번~10번 시설 크롤링)
 * 
 *   이어서 하기: 자동으로 마지막 진행 위치부터 시작
 */

const CONFIG = {
    SEARCH_DELAY: 3000,          // 검색 간 딜레이 (ms)
    PAGE_LOAD_TIMEOUT: 15000,    // 페이지 로드 타임아웃
    MAX_PAGES_PER_SITE: 30,      // 사이트 내 최대 탐색 페이지 수
    IMAGE_DIR: path.join(__dirname, '..', 'crawled_images'),
    OUTPUT_FILE: path.join(__dirname, '..', 'data', 'crawled_facility_data.json'),
    PROGRESS_FILE: path.join(__dirname, '..', 'data', 'crawl_progress.json')
};

// 이미지 디렉토리 생성
if (!fs.existsSync(CONFIG.IMAGE_DIR)) {
    fs.mkdirSync(CONFIG.IMAGE_DIR, { recursive: true });
}

// 제외할 도메인 (SNS, 검색엔진, 블로그 등)
const EXCLUDED_DOMAINS = [
    'google.com', 'google.co.kr', 'youtube.com', 'facebook.com', 'instagram.com',
    'twitter.com', 'naver.com', 'blog.naver.com', 'cafe.naver.com',
    'daum.net', 'kakao.com', 'tistory.com',
    'wikipedia.org', 'namu.wiki',
    'saramin.co.kr', 'jobkorea.co.kr', 'incruit.com', 'wanted.co.kr',
    'bizno.net', 'map.naver.com', 'place.naver.com', 'map.kakao.com'
];

// 가격 관련 키워드
const PRICE_KEYWORDS = [
    '이용료', '사용료', '가격', '비용', '요금', '수수료',
    '분양', '분묘', '봉안', '납골', '안치', '화장',
    '개인묘', '부부묘', '가족묘', '단독묘',
    '10년', '15년', '30년', '50년', '영구',
    '관리비', '사용기간'
];

class FacilityCrawler {
    constructor() {
        this.browser = null;
        this.context = null;
        this.results = this.loadExistingResults();
        this.progress = this.loadProgress();
    }

    /**
     * 기존 결과 불러오기 (이어서 하기 위해)
     */
    loadExistingResults() {
        try {
            if (fs.existsSync(CONFIG.OUTPUT_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.OUTPUT_FILE, 'utf-8'));
                console.log(`📂 기존 결과 불러옴: ${data.length}개`);
                return data;
            }
        } catch (e) {
            console.log('⚠️ 기존 결과 없음, 새로 시작');
        }
        return [];
    }

    /**
     * 진행 상황 불러오기
     */
    loadProgress() {
        try {
            if (fs.existsSync(CONFIG.PROGRESS_FILE)) {
                const data = JSON.parse(fs.readFileSync(CONFIG.PROGRESS_FILE, 'utf-8'));
                console.log(`📍 마지막 진행 위치: ${data.lastIndex + 1}번`);
                return data;
            }
        } catch (e) { }
        return { lastIndex: -1, completed: [] };
    }

    saveProgress(index) {
        this.progress.lastIndex = index;
        this.progress.lastUpdated = new Date().toISOString();
        fs.writeFileSync(CONFIG.PROGRESS_FILE, JSON.stringify(this.progress, null, 2));
    }

    async init() {
        this.browser = await playwright.chromium.launch({
            headless: false, // 디버깅을 위해 브라우저 표시
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 },
            locale: 'ko-KR'
        });
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    /**
     * DuckDuckGo 검색에서 시설 웹사이트 찾기 (봇 탐지 없음)
     */
    async searchWebsite(facilityName, address) {
        const page = await this.context.newPage();
        const candidates = [];

        try {
            // DuckDuckGo 검색 (봇 탐지 없음)
            const searchQuery = `${facilityName} 홈페이지`;
            console.log(`🔍 DuckDuckGo 검색: "${searchQuery}"`);

            await page.goto(`https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&kl=kr-kr`, {
                waitUntil: 'networkidle',
                timeout: CONFIG.PAGE_LOAD_TIMEOUT
            });

            await page.waitForTimeout(2000);

            // DuckDuckGo 검색 결과에서 링크 추출
            const links = await page.evaluate(() => {
                const results = [];

                // DuckDuckGo 결과 링크 셀렉터
                document.querySelectorAll('a[data-testid="result-title-a"], article a[href^="http"]').forEach(link => {
                    const href = link.href;
                    const text = link.textContent?.trim() || '';
                    if (href && (href.startsWith('http://') || href.startsWith('https://')) && !href.includes('duckduckgo.com')) {
                        if (!results.find(r => r.href === href)) {
                            results.push({ href, text: text.substring(0, 150), title: '' });
                        }
                    }
                });

                // 백업: 모든 외부 링크 수집
                if (results.length === 0) {
                    document.querySelectorAll('a[href^="http"]').forEach(link => {
                        const href = link.href;
                        const text = link.textContent?.trim() || '';
                        if (href && !href.includes('duckduckgo.com') && !results.find(r => r.href === href)) {
                            results.push({ href, text: text.substring(0, 150), title: '' });
                        }
                    });
                }

                return results;
            });

            console.log(`  📎 구글에서 발견된 링크: ${links.length}개`);

            // 필터링
            for (const link of links) {
                try {
                    const url = new URL(link.href);
                    const domain = url.hostname.toLowerCase();

                    const isExcluded = EXCLUDED_DOMAINS.some(excluded =>
                        domain.includes(excluded) || domain === excluded
                    );

                    if (!isExcluded) {
                        candidates.push({
                            url: link.href,
                            domain,
                            text: link.text,
                            score: this.calculateScore(link, facilityName)
                        });
                    }
                } catch (e) { }
            }

            // 점수순 정렬
            candidates.sort((a, b) => b.score - a.score);

            console.log(`  ✅ 후보 사이트: ${candidates.length}개`);
            candidates.slice(0, 5).forEach((c, i) => {
                console.log(`     ${i + 1}. [${c.score}점] ${c.domain}`);
            });

        } catch (error) {
            console.error(`  ❌ 검색 오류: ${error.message}`);
        } finally {
            await page.close();
        }

        return candidates.slice(0, 5);
    }

    /**
     * 링크 점수 계산
     */
    calculateScore(link, facilityName) {
        let score = 0;
        const text = (link.text + ' ' + link.title).toLowerCase();
        const facilityLower = facilityName.toLowerCase().replace(/[\(\)（）]/g, '');

        // 시설명 일부 포함
        const facilityWords = facilityLower.split(/\s+/);
        for (const word of facilityWords) {
            if (word.length >= 2 && text.includes(word)) score += 20;
        }

        // 홈페이지 관련 키워드
        if (text.includes('홈페이지') || text.includes('공식')) score += 30;
        if (text.includes('이용안내') || text.includes('시설소개')) score += 20;

        // 장례/묘지 관련 키워드
        if (text.includes('추모') || text.includes('공원묘원') || text.includes('납골')) score += 25;
        if (text.includes('봉안') || text.includes('안치') || text.includes('장례')) score += 25;

        // URL 루트 페이지 가점
        try {
            const url = new URL(link.href);
            if (url.pathname === '/' || url.pathname === '') score += 10;
        } catch (e) { }

        return score;
    }

    /**
     * 웹사이트 내 모든 페이지 탐색하여 가격과 이미지 수집
     */
    async crawlWebsite(baseUrl, facilityName, facilityNo) {
        const page = await this.context.newPage();
        const visitedUrls = new Set();
        const prices = [];
        const images = [];
        const pagesToVisit = [baseUrl];

        console.log(`\n🌐 사이트 크롤링: ${baseUrl}`);

        try {
            const baseDomain = new URL(baseUrl).hostname;

            while (pagesToVisit.length > 0 && visitedUrls.size < CONFIG.MAX_PAGES_PER_SITE) {
                const currentUrl = pagesToVisit.shift();

                if (visitedUrls.has(currentUrl)) continue;
                visitedUrls.add(currentUrl);

                console.log(`  📄 [${visitedUrls.size}/${CONFIG.MAX_PAGES_PER_SITE}] ${currentUrl.substring(0, 80)}...`);

                try {
                    await page.goto(currentUrl, {
                        waitUntil: 'networkidle',
                        timeout: CONFIG.PAGE_LOAD_TIMEOUT
                    });
                    await page.waitForTimeout(1500);

                    // 페이지 콘텐츠 분석
                    const pageData = await page.evaluate(() => {
                        const data = {
                            text: document.body?.innerText || '',
                            links: [],
                            images: []
                        };

                        // 내부 링크 수집
                        document.querySelectorAll('a[href]').forEach(link => {
                            const href = link.href;
                            if (href && !href.startsWith('javascript:') && !href.startsWith('mailto:')) {
                                data.links.push(href);
                            }
                        });

                        // 이미지 수집
                        document.querySelectorAll('img').forEach(img => {
                            const src = img.src || img.dataset?.src;
                            const width = img.naturalWidth || img.width || 0;
                            const height = img.naturalHeight || img.height || 0;
                            const alt = img.alt || '';

                            if (src && (width >= 100 && height >= 100)) {
                                data.images.push({ src, alt, width, height });
                            } else if (src && !src.includes('logo') && !src.includes('icon') && !src.includes('favicon')) {
                                data.images.push({ src, alt, width: 0, height: 0 });
                            }
                        });

                        return data;
                    });

                    // 가격 정보 추출
                    const priceInfo = this.extractPrices(pageData.text, currentUrl);
                    if (priceInfo.length > 0) {
                        prices.push(...priceInfo);
                        console.log(`    💰 가격 발견: ${priceInfo.length}개`);
                    }

                    // 이미지 수집
                    for (const img of pageData.images) {
                        if (!images.find(i => i.src === img.src)) {
                            images.push(img);
                        }
                    }

                    // 내부 링크 추가
                    for (const link of pageData.links) {
                        try {
                            const linkUrl = new URL(link);
                            if (linkUrl.hostname === baseDomain && !visitedUrls.has(link)) {
                                if (this.isPricePage(link)) {
                                    pagesToVisit.unshift(link);
                                } else {
                                    pagesToVisit.push(link);
                                }
                            }
                        } catch (e) { }
                    }

                } catch (error) {
                    console.log(`    ⚠️ 페이지 오류: ${error.message.substring(0, 50)}`);
                }
            }

        } catch (error) {
            console.error(`  ❌ 크롤링 오류: ${error.message}`);
        } finally {
            await page.close();
        }

        console.log(`  📊 완료 - 페이지: ${visitedUrls.size}, 가격: ${prices.length}, 이미지: ${images.length}`);

        // 이미지 다운로드
        const savedImages = await this.downloadImages(images, facilityNo, facilityName);

        return {
            visitedPages: visitedUrls.size,
            prices: this.deduplicatePrices(prices),
            images: savedImages
        };
    }

    isPricePage(url) {
        const keywords = ['price', 'cost', 'fee', '이용료', '가격', '요금', '안내', 'guide', 'info', '분양'];
        const urlLower = url.toLowerCase();
        return keywords.some(kw => urlLower.includes(kw));
    }

    extractPrices(text, sourceUrl) {
        const prices = [];
        const lines = text.split('\n');

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.length > 300) continue;

            const hasKeyword = PRICE_KEYWORDS.some(kw => trimmed.includes(kw));
            const hasPrice = /(\d{1,3}(?:,\d{3})*)\s*(원|만원|만\s*원)/.test(trimmed);

            if (hasKeyword || hasPrice) {
                const priceMatch = trimmed.match(/(\d{1,3}(?:,\d{3})*)\s*(원|만원|만\s*원)/);

                prices.push({
                    text: trimmed.substring(0, 200),
                    price: priceMatch ? priceMatch[0] : null,
                    sourceUrl
                });
            }
        }

        return prices;
    }

    deduplicatePrices(prices) {
        const seen = new Set();
        return prices.filter(p => {
            const key = p.text.substring(0, 50);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    async downloadImages(images, facilityNo, facilityName) {
        const savedImages = [];
        const safeName = facilityName.replace(/[\/\\:*?"<>|]/g, '_').substring(0, 50);
        const facilityDir = path.join(CONFIG.IMAGE_DIR, `${facilityNo}_${safeName}`);

        if (!fs.existsSync(facilityDir)) {
            fs.mkdirSync(facilityDir, { recursive: true });
        }

        let count = 0;
        for (const img of images.slice(0, 20)) {
            try {
                const ext = path.extname(new URL(img.src).pathname) || '.jpg';
                const filename = `img_${String(count).padStart(3, '0')}${ext}`;
                const filepath = path.join(facilityDir, filename);

                await this.downloadFile(img.src, filepath);
                savedImages.push({
                    localPath: filepath,
                    originalUrl: img.src,
                    alt: img.alt
                });
                count++;
            } catch (error) { }
        }

        if (count > 0) {
            console.log(`    📷 이미지 저장: ${count}개`);
        }

        return savedImages;
    }

    downloadFile(url, filepath) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;

            const request = protocol.get(url, { timeout: 10000 }, (response) => {
                if (response.statusCode === 200) {
                    const file = fs.createWriteStream(filepath);
                    response.pipe(file);
                    file.on('finish', () => {
                        file.close();
                        resolve();
                    });
                } else if (response.statusCode === 301 || response.statusCode === 302) {
                    this.downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
                } else {
                    reject(new Error(`HTTP ${response.statusCode}`));
                }
            });

            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Timeout'));
            });
        });
    }

    /**
     * 메인 실행 함수
     */
    async run(startIndex = 0, endIndex = null) {
        const inputFile = path.join(__dirname, '..', 'extracted_facility_info.json');
        const facilities = JSON.parse(fs.readFileSync(inputFile, 'utf-8'));

        const end = endIndex || facilities.length;

        // 자동으로 마지막 진행 위치부터 시작 (옵션)
        const actualStart = startIndex > 0 ? startIndex - 1 : startIndex; // 1-indexed to 0-indexed

        console.log(`\n${'='.repeat(60)}`);
        console.log(`🚀 크롤링 시작`);
        console.log(`   시설 범위: ${actualStart + 1}번 ~ ${end}번 (총 ${facilities.length}개 중)`);
        console.log(`   저장 위치: ${CONFIG.OUTPUT_FILE}`);
        console.log(`   이미지 폴더: ${CONFIG.IMAGE_DIR}`);
        console.log(`${'='.repeat(60)}\n`);

        await this.init();

        for (let i = actualStart; i < end; i++) {
            const facility = facilities[i];

            // 이미 완료된 시설 스킵
            if (this.results.find(r => r.no === facility.no)) {
                console.log(`\n⏭️ [${i + 1}] ${facility.name} - 이미 완료됨, 스킵`);
                continue;
            }

            console.log(`\n${'─'.repeat(60)}`);
            console.log(`📍 [${i + 1}/${end}] ${facility.name}`);
            console.log(`   주소: ${facility.address || 'N/A'}`);
            console.log(`${'─'.repeat(60)}`);

            const result = {
                no: facility.no,
                name: facility.name,
                address: facility.address,
                website: null,
                candidates: [],
                prices: [],
                images: [],
                crawledAt: new Date().toISOString()
            };

            try {
                // 1. 웹사이트 검색
                const candidates = await this.searchWebsite(facility.name, facility.address);
                result.candidates = candidates;

                if (candidates.length > 0) {
                    const bestCandidate = candidates[0];
                    result.website = bestCandidate.url;

                    // 2. 사이트 크롤링
                    const crawlResult = await this.crawlWebsite(bestCandidate.url, facility.name, facility.no);
                    result.prices = crawlResult.prices;
                    result.images = crawlResult.images;
                }
            } catch (error) {
                console.error(`  ❌ 시설 처리 오류: ${error.message}`);
                result.error = error.message;
            }

            this.results.push(result);

            // 매 시설마다 저장 (안전하게)
            this.saveResults();
            this.saveProgress(i);
            console.log(`  💾 저장 완료`);

            // 딜레이
            await new Promise(resolve => setTimeout(resolve, CONFIG.SEARCH_DELAY));
        }

        await this.close();

        console.log(`\n${'='.repeat(60)}`);
        console.log(`✅ 크롤링 완료!`);
        this.printSummary();
        console.log(`${'='.repeat(60)}\n`);
    }

    saveResults() {
        fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(this.results, null, 2), 'utf-8');
    }

    printSummary() {
        const withWebsite = this.results.filter(r => r.website).length;
        const withPrices = this.results.filter(r => r.prices.length > 0).length;
        const withImages = this.results.filter(r => r.images.length > 0).length;

        console.log(`\n📊 결과 요약:`);
        console.log(`   총 시설: ${this.results.length}개`);
        console.log(`   웹사이트 발견: ${withWebsite}개 (${Math.round(withWebsite / this.results.length * 100)}%)`);
        console.log(`   가격 정보: ${withPrices}개 (${Math.round(withPrices / this.results.length * 100)}%)`);
        console.log(`   이미지 수집: ${withImages}개 (${Math.round(withImages / this.results.length * 100)}%)`);
    }
}

// 실행
if (require.main === module) {
    const args = process.argv.slice(2);
    const startIndex = parseInt(args[0]) || 1;  // 기본값 1번부터
    const endIndex = args[1] ? parseInt(args[1]) : null;

    console.log(`\n📋 작업 내용:`);
    console.log(`   1. 구글 검색으로 시설 웹사이트 찾기 (1페이지 전체 스캔)`);
    console.log(`   2. 웹사이트 내 모든 페이지 탐색 (최대 ${CONFIG.MAX_PAGES_PER_SITE}페이지)`);
    console.log(`   3. 가격 정보 추출 및 저장`);
    console.log(`   4. 이미지 다운로드 (시설당 최대 20개)\n`);

    const crawler = new FacilityCrawler();
    crawler.run(startIndex, endIndex)
        .catch(error => {
            console.error('Fatal error:', error);
            process.exit(1);
        });
}

module.exports = { FacilityCrawler };
