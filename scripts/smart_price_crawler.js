const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

/**
 * 스마트 가격 크롤러 v3
 * - 호버 메뉴 탐색 강화
 * - 새창/팝업 탐색
 * - 실제 분양가 추출 (할인금 제외)
 */

const CONFIG = {
    URLS_FILE: path.join(__dirname, '..', 'data', 'facility_urls_cleaned.json'),
    OUTPUT_FILE: path.join(__dirname, '..', 'data', 'smart_crawled_data.json'),
    IMAGES_DIR: path.join(__dirname, '..', 'crawled_images_v2'),
    MAX_PAGES: 25,
    PAGE_TIMEOUT: 15000,
    DELAY: 1500,
};

// 카테고리 분류 키워드
const CATEGORIES = {
    묘지: ['묘지', '매장', '분묘', '평장', '가족묘', '개인묘', '부부묘', '부부형', '가족형'],
    봉안당: ['봉안당', '봉안', '납골', '안치', '추모관', '영구안치', '에데나', '로얄', '팰리스', '아트리움', '루멘'],
    자연장: ['자연장', '수목장', '잔디장', '화초장', '산골'],
    관리비: ['관리비', '관리료', '연회비', '유지비'],
};

class SmartPriceCrawler {
    constructor() {
        this.browser = null;
        this.context = null;
        this.results = [];
    }

    async init() {
        this.browser = await playwright.chromium.launch({
            headless: false,
            args: ['--no-sandbox']
        });
        this.context = await this.browser.newContext({
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            viewport: { width: 1400, height: 900 },
            locale: 'ko-KR'
        });
    }

    async close() {
        if (this.browser) await this.browser.close();
    }

    // 가격 패턴 추출 - "정가 → 할인가" 패턴 처리
    extractPrices(text) {
        const prices = [];

        // 패턴: "1800만원 1650만원" (정가 할인가) - 할인가만 추출
        const discountPattern = /(\d{3,4})만원\s+(\d{3,4})만원/g;
        let match;
        while ((match = discountPattern.exec(text)) !== null) {
            const originalPrice = parseInt(match[1]) * 10000;
            const discountedPrice = parseInt(match[2]) * 10000;

            // 할인가만 추출 (두 번째 가격이 더 작으면)
            if (discountedPrice < originalPrice && discountedPrice >= 5000000) {
                const idx = text.indexOf(match[0]);
                const context = text.substring(Math.max(0, idx - 50), idx + match[0].length + 50).trim();

                prices.push({
                    price: discountedPrice,
                    priceText: match[2] + '만원',
                    context: context,
                    category: this.detectCategory(context),
                    type: '할인가'
                });
            }
        }

        // 단일 가격 패턴: "886만원", "1136만원" 등
        const singlePattern = /(\d{3,4})만원/g;
        while ((match = singlePattern.exec(text)) !== null) {
            const value = parseInt(match[1]) * 10000;

            // 합리적인 가격 범위 (500만원 ~ 1억)
            if (value >= 5000000 && value <= 100000000) {
                const idx = text.indexOf(match[0]);
                const context = text.substring(Math.max(0, idx - 50), idx + match[0].length + 50).trim();

                // 이미 할인가로 추출한 것은 제외
                if (prices.some(p => p.priceText === match[0])) continue;

                // 할인/지원금 컨텍스트면 제외
                if (context.includes('지원금') || context.includes('할인 제공') ||
                    context.includes('할인 혜택')) {
                    continue;
                }

                prices.push({
                    price: value,
                    priceText: match[0],
                    context: context,
                    category: this.detectCategory(context),
                    type: '분양가'
                });
            }
        }

        // 중복 제거
        const unique = [];
        const seen = new Set();
        for (const p of prices) {
            if (!seen.has(p.price)) {
                seen.add(p.price);
                unique.push(p);
            }
        }

        return unique;
    }

    // 카테고리 감지
    detectCategory(text) {
        for (const [cat, keywords] of Object.entries(CATEGORIES)) {
            if (keywords.some(kw => text.includes(kw))) {
                return cat;
            }
        }
        return '기타';
    }

    // 호버 메뉴 탐색 및 모든 링크 수집
    async collectAllLinks(page, url) {
        const links = new Map();
        const baseUrl = new URL(url).origin;

        try {
            // 1. 메인 메뉴 호버해서 서브메뉴 열기
            const mainMenus = await page.$$('nav > ul > li, .gnb > li, #gnb > li, header nav > ul > li');
            console.log(`    🔍 메인 메뉴: ${mainMenus.length}개`);

            for (const menu of mainMenus.slice(0, 8)) {
                try {
                    await menu.hover();
                    await page.waitForTimeout(300);

                    // 서브메뉴 링크 수집
                    const subLinks = await menu.$$eval('a', els =>
                        els.map(a => ({ text: a.textContent?.trim(), href: a.href }))
                    );

                    for (const link of subLinks) {
                        if (link.text && link.href && link.text.length < 25) {
                            links.set(link.text, link.href);
                        }
                    }
                } catch (e) { }
            }

            // 2. 모든 페이지 링크 수집
            const allLinks = await page.$$eval('a[href]', els =>
                els.map(a => ({ text: a.textContent?.trim(), href: a.href }))
                    .filter(a => a.text && a.text.length < 30)
            );

            for (const link of allLinks) {
                if (link.href.includes(new URL(url).hostname)) {
                    links.set(link.text, link.href);
                }
            }

        } catch (e) { }

        console.log(`    📋 총 링크: ${links.size}개`);
        return links;
    }

    // 페이지 탐색 및 가격 추출
    async crawlPage(page, url) {
        const prices = [];
        const visited = new Set();

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
            await page.waitForTimeout(1500);

            // 1. 현재 페이지 가격 추출
            const bodyText = await page.evaluate(() => document.body.innerText);
            prices.push(...this.extractPrices(bodyText));
            console.log(`    📄 메인 페이지: ${prices.length}개 가격 발견`);

            // 2. 모든 링크 수집
            const links = await this.collectAllLinks(page, url);

            // 3. 중요 키워드 있는 링크 우선 탐색
            const priorityKeywords = ['에데나', '봉안당', '분양', '가격', '패키지', '묘지', '수목'];
            const sortedLinks = [...links.entries()].sort((a, b) => {
                const aPriority = priorityKeywords.some(kw => a[0].includes(kw)) ? 0 : 1;
                const bPriority = priorityKeywords.some(kw => b[0].includes(kw)) ? 0 : 1;
                return aPriority - bPriority;
            });

            let pageCount = 0;
            for (const [text, href] of sortedLinks) {
                if (pageCount >= CONFIG.MAX_PAGES) break;
                if (visited.has(href)) continue;
                if (!href.startsWith('http')) continue;

                visited.add(href);
                pageCount++;

                process.stdout.write(`    [${pageCount}] ${text.substring(0, 15).padEnd(15)}...`);

                try {
                    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
                    await page.waitForTimeout(800);

                    const pageText = await page.evaluate(() => document.body.innerText);
                    const pagePrices = this.extractPrices(pageText);
                    prices.push(...pagePrices);

                    console.log(` 💰 ${pagePrices.length}개`);
                } catch (e) {
                    console.log(` ❌`);
                }
            }

            // 4. 특별 처리: "에데나", "봉안당" 버튼 클릭
            console.log(`    🖱️ 특수 버튼 클릭 탐색...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
            await page.waitForTimeout(1000);

            const specialButtons = ['에데나', '봉안당 에데나', '분양상품'];

            for (const btnText of specialButtons) {
                try {
                    // 텍스트로 요소 찾기
                    const btn = await page.locator(`text="${btnText}"`).first();
                    if (await btn.count() > 0) {
                        process.stdout.write(`    [특수] ${btnText}...`);

                        // 새창 열림 감지
                        const [newPage] = await Promise.all([
                            this.context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
                            btn.click().catch(() => null)
                        ]);

                        if (newPage) {
                            await newPage.waitForLoadState('domcontentloaded');
                            const text = await newPage.evaluate(() => document.body.innerText);
                            const newPrices = this.extractPrices(text);
                            prices.push(...newPrices);
                            console.log(` 💰 ${newPrices.length}개 (새창)`);
                            await newPage.close();
                        } else {
                            await page.waitForTimeout(1500);
                            const text = await page.evaluate(() => document.body.innerText);
                            const newPrices = this.extractPrices(text);
                            prices.push(...newPrices);
                            console.log(` 💰 ${newPrices.length}개`);
                        }

                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
                    }
                } catch (e) {
                    console.log(` ❌`);
                }
            }

        } catch (e) {
            console.log(`    ❌ 오류: ${e.message.substring(0, 40)}`);
        }

        // 중복 제거
        const unique = [];
        const seen = new Set();
        for (const p of prices) {
            const key = p.price;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(p);
            }
        }

        return unique;
    }

    // 이미지 다운로드
    async downloadImages(page, url, facilityNo, facilityName) {
        const images = [];
        const dir = path.join(CONFIG.IMAGES_DIR, `${facilityNo}_${facilityName.replace(/[\/\\:]/g, '_')}`);

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
            await page.waitForTimeout(1000);

            const imgUrls = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('img'))
                    .map(img => img.src)
                    .filter(src => src && src.startsWith('http') && !src.includes('logo') && !src.includes('icon'))
                    .slice(0, 15);
            });

            for (let i = 0; i < imgUrls.length; i++) {
                try {
                    const response = await page.context().request.get(imgUrls[i]);
                    const buffer = await response.body();
                    const ext = imgUrls[i].split('.').pop().split('?')[0] || 'jpg';
                    const filePath = path.join(dir, `image_${i + 1}.${ext}`);
                    fs.writeFileSync(filePath, buffer);
                    images.push(filePath);
                } catch (e) { }
            }
        } catch (e) { }

        return images;
    }

    async run(startNo = 1, endNo = null) {
        const urlData = JSON.parse(fs.readFileSync(CONFIG.URLS_FILE, 'utf-8'));
        const withUrl = urlData.filter(d => d.url);

        const start = startNo - 1;
        const end = endNo ? Math.min(endNo, withUrl.length) : withUrl.length;

        console.log('\n' + '='.repeat(60));
        console.log('🚀 스마트 가격 크롤러 v3');
        console.log(`   대상: ${start + 1}번 ~ ${end}번 (URL 있는 ${withUrl.length}개 중)`);
        console.log('='.repeat(60) + '\n');

        await this.init();
        const page = await this.context.newPage();

        for (let i = start; i < end; i++) {
            const facility = withUrl[i];

            console.log('\n' + '─'.repeat(60));
            console.log(`📍 [${i + 1}/${end}] ${facility.name}`);
            console.log(`   URL: ${facility.url}`);
            console.log('─'.repeat(60));

            const prices = await this.crawlPage(page, facility.url);
            const images = await this.downloadImages(page, facility.url, facility.no, facility.name);

            // 카테고리별 분류
            const categorized = {
                묘지: prices.filter(p => p.category === '묘지'),
                봉안당: prices.filter(p => p.category === '봉안당'),
                자연장: prices.filter(p => p.category === '자연장'),
                관리비: prices.filter(p => p.category === '관리비'),
                기타: prices.filter(p => p.category === '기타')
            };

            const result = {
                no: facility.no,
                name: facility.name,
                url: facility.url,
                prices: categorized,
                allPrices: prices,
                totalPrices: prices.length,
                images: images.length,
                crawledAt: new Date().toISOString()
            };

            this.results.push(result);

            console.log(`\n   📊 결과:`);
            console.log(`      총 가격: ${prices.length}개`);
            for (const [cat, items] of Object.entries(categorized)) {
                if (items.length > 0) {
                    console.log(`      ${cat}: ${items.length}개`);
                    items.slice(0, 3).forEach(p => {
                        console.log(`         - ${p.priceText} (${p.context.substring(0, 25)}...)`);
                    });
                }
            }
            console.log(`      이미지: ${images.length}개`);

            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(this.results, null, 2));

            await new Promise(r => setTimeout(r, CONFIG.DELAY));
        }

        await this.close();

        console.log('\n' + '='.repeat(60));
        console.log('✅ 크롤링 완료!');
        console.log(`   저장: ${CONFIG.OUTPUT_FILE}`);
        console.log('='.repeat(60) + '\n');
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const start = parseInt(args[0]) || 1;
    const end = args[1] ? parseInt(args[1]) : null;

    const crawler = new SmartPriceCrawler();
    crawler.run(start, end).catch(console.error);
}

module.exports = SmartPriceCrawler;
