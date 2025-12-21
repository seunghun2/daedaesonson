const fs = require('fs');
const path = require('path');
const playwright = require('playwright');

/**
 * 딥 크롤러 v4
 * - 페이지 내 모든 탭/버튼 클릭
 * - 새창/팝업 탐색
 * - 호버 메뉴 탐색
 * - 완전 탐색 모드
 */

const CONFIG = {
    URLS_FILE: path.join(__dirname, '..', 'data', 'facility_urls_cleaned.json'),
    OUTPUT_FILE: path.join(__dirname, '..', 'data', 'deep_crawled_data.json'),
    IMAGES_DIR: path.join(__dirname, '..', 'crawled_images_v3'),
    MAX_PAGES: 30,
    MAX_CLICKS_PER_PAGE: 20,
    PAGE_TIMEOUT: 15000,
    DELAY: 1000,
};

// 카테고리 분류
const CATEGORIES = {
    묘지: ['묘지', '매장', '분묘', '평장', '가족묘', '개인묘', '부부묘', '부부형', '가족형'],
    봉안당: ['봉안당', '봉안', '납골', '안치', '추모관', '에데나', '로얄', '팰리스', '아트리움', '루멘', '에덴'],
    자연장: ['자연장', '수목장', '잔디장', '화초장', '산골'],
    관리비: ['관리비', '관리료', '연회비', '유지비'],
};

const RELIGIONS = {
    기독교: ['기독교', '교회', '하나님', '예수', '목사', '성경', '크리스찬'],
    불교: ['불교', '사찰', '스님', '부처', '지장보살', '극락', '영가', '연화'],
    천주교: ['천주교', '성당', '신부', '수녀', '마리아', '공소', '천주교교구'],
    유교: ['유교', '전통', '제례', '종중', '문중', '선산']
};

class DeepCrawler {
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

    // 가격 추출 v5 - 노이즈 필터링 강화
    extractPrices(text) {
        const prices = [];
        const seen = new Set();

        // 텍스트 정제
        const cleanText = text.replace(/\s+/g, ' ');

        // 노이즈 차단용 정규표현식 (대폭 강화)
        const noisePatterns = [
            /0\d{1,3}[)-]\d{3,4}-?\d{0,4}/,   // 전화번호
            /\d{3}-\d{2}-\d{5}/,              // 사업자번호
            /Fax|Tel|FAX|TEL/i,               // 팩스/전화 표시
            /\d{1,4}번지|\d{1,4}번길/,           // 주소
            /20[0-2][0-9]\s*(년|edena|\.)/i,   // 연도
            /Copyright|\u00a9/i,              // 저작권
            /사업자등록번호/,                    // 사업자 표시
            /지원금|할인제공|지원상조/,             // 지원금 관련
            /\d{1,2}시~?\d{0,2}시/,             // 시간 표시
            /365일|연중무휴/                    // 운영정보
        ];

        const isNoise = (ctx) => noisePatterns.some(p => p.test(ctx));

        // 패턴1: "정가 → 할인가" 패턴 (1800만원 1650만원)
        const discountPattern = /(\d{3,4})만원\s+(\d{3,4})만원/g;
        let match;
        while ((match = discountPattern.exec(cleanText)) !== null) {
            const original = parseInt(match[1]) * 10000;
            const discounted = parseInt(match[2]) * 10000;

            if (discounted < original && discounted >= 1000000 && original <= 100000000) {
                const ctx = this.getContext(cleanText, match.index, match[0].length);
                if (isNoise(ctx)) continue;

                const productName = this.inferProductName(ctx, match[0]);
                if (productName === '노이즈' || productName.length < 2) continue;

                if (!seen.has(original + productName)) {
                    seen.add(original + productName);
                    prices.push({
                        price: original,
                        priceText: match[1] + '만원',
                        context: ctx.substring(0, 80),
                        productName,
                        category: this.detectCategory(ctx),
                        type: '정가'
                    });
                }
                if (!seen.has(discounted + productName)) {
                    seen.add(discounted + productName);
                    prices.push({
                        price: discounted,
                        priceText: match[2] + '만원',
                        context: ctx.substring(0, 80),
                        productName,
                        category: this.detectCategory(ctx),
                        type: '할인가'
                    });
                }
            }
        }

        // 패턴2: 단일 가격 "886만원"
        const singlePattern = /(\d{1,4}(,\d{3})?)만원/g;
        while ((match = singlePattern.exec(cleanText)) !== null) {
            const cleanValStr = match[1].replace(/,/g, '');
            const value = parseInt(cleanValStr) * 10000;

            if (value >= 1000000 && value <= 100000000) {
                const ctx = this.getContext(cleanText, match.index, match[0].length);
                if (isNoise(ctx)) continue;

                const productName = this.inferProductName(ctx, match[0]);
                if (productName === '노이즈' || productName.length < 2) continue;

                if (!seen.has(value + productName)) {
                    seen.add(value + productName);
                    prices.push({
                        price: value,
                        priceText: match[0],
                        context: ctx.substring(0, 80),
                        productName,
                        category: this.detectCategory(ctx),
                        type: '분양가'
                    });
                }
            }
        }

        return prices;
    }

    // [중요] 테이블 구조 분석 파서 v2 - 정교화
    async extractFromTables(page) {
        return await page.evaluate(() => {
            const results = [];
            const seen = new Set();

            // 가격으로 보이는 숫자인지 판별 (100만원 ~ 1억)
            function isPriceLike(str) {
                const clean = str.replace(/[,\s]/g, '').trim();
                if (!/^\d{3,4}$/.test(clean)) return false;
                const num = parseInt(clean);
                return num >= 100 && num <= 10000;
            }

            // 의미 있는 헤더인지 판별
            function isValidHeader(str) {
                if (!str || str.length < 2 || str.length > 20) return false;
                if (/^\d+$/.test(str)) return false; // 순수 숫자만 있으면 제외
                return true;
            }

            // 의미 있는 행 라벨인지 판별
            function isValidRowLabel(str) {
                if (!str || str.length < 1 || str.length > 15) return false;
                // N단, N층, VIP 등의 패턴
                return /\d+단|\d+층|VIP|개인|부부|가족|특실|일반|프리미엄/.test(str) || str.length <= 5;
            }

            const tables = document.querySelectorAll('table');
            tables.forEach(table => {
                const rows = Array.from(table.querySelectorAll('tr'));
                if (rows.length < 2) return;

                // 헤더 추출 (첫 번째 행)
                const headerCells = rows[0].querySelectorAll('th, td');
                const headers = Array.from(headerCells).map(el => el.innerText.trim());

                // 데이터 행 분석
                rows.slice(1).forEach(row => {
                    const cells = Array.from(row.querySelectorAll('td, th'));
                    if (cells.length < 2) return;

                    const rowLabel = cells[0]?.innerText?.trim() || '';
                    if (!isValidRowLabel(rowLabel)) return;

                    cells.forEach((cell, idx) => {
                        if (idx === 0) return; // 첫 번째 칸은 라벨

                        const cellText = cell.innerText.trim();
                        if (!isPriceLike(cellText)) return;

                        const headerLabel = headers[idx] || '';
                        if (!isValidHeader(headerLabel) && !isValidRowLabel(rowLabel)) return;

                        // 상품명 조합: "헤더 + 행라벨" 또는 각각
                        let productName = '';
                        if (isValidHeader(headerLabel) && isValidRowLabel(rowLabel)) {
                            productName = `${headerLabel} ${rowLabel}`.trim();
                        } else if (isValidHeader(headerLabel)) {
                            productName = headerLabel;
                        } else if (isValidRowLabel(rowLabel)) {
                            productName = rowLabel;
                        } else {
                            return; // 둘 다 유효하지 않으면 스킵
                        }

                        const price = parseInt(cellText.replace(/,/g, '')) * 10000;
                        const key = price + productName;

                        if (!seen.has(key) && price >= 1000000 && price <= 100000000) {
                            seen.add(key);
                            results.push({
                                price,
                                priceText: cellText + '만원',
                                context: `표: ${productName}`,
                                productName,
                                category: '',
                                type: '테이블가격'
                            });
                        }
                    });
                });
            });
            return results;
        });
    }

    // 상품명 유추 로직 v2
    inferProductName(ctx, priceStr) {
        // 노이즈 패턴 검출
        if (/Fax|Tel|FAX|TEL|0\d{1,2}[)-]\d{3,4}|사업자등록|Copyright/i.test(ctx)) {
            return '노이즈';
        }

        const parts = ctx.split(priceStr);
        const before = (parts[0] || '').slice(-35).trim();
        const after = (parts[1] || '').slice(0, 25).trim();
        const combined = before + ' ' + after;

        // 핵심 키워드 패턴 (우선순위대로)
        const patterns = [
            // 패키지 유형
            /([A-Z]\s*패키지)/i,
            /(패키지\s*[A-Z])/i,
            // 관/실 이름 + 단/층
            /([가-힣]+관\s*\d+단)/,
            /([가-힣]+실\s*\d+단)/,
            /((\d+단|\d+층)\s*[가-힣]+관)/,
            // 단독 키워드
            /([가-힣]{2,6}관)/,
            /([가-힣]{2,6}실)/,
            /(\d+단)/,
            /(\d+층)/,
            /(개인형|부부형|가족형)/,
            /(VIP|프리미엄|로얄)/i,
            /(매장묘|봉안묘|수목장|평장묘|자연장)/,
            /(봉안당|추모관)/
        ];

        const found = [];
        for (const p of patterns) {
            const m = combined.match(p);
            if (m) found.push(m[1]);
        }

        if (found.length > 0) {
            return [...new Set(found)].slice(0, 2).join(' ');
        }

        return '일반상품';
    }

    detectReligion(text) {
        for (const [rel, keywords] of Object.entries(RELIGIONS)) {
            if (keywords.some(kw => text.includes(kw))) {
                return rel;
            }
        }
        return '일반/무교';
    }

    getContext(text, index, length) {
        return text.substring(Math.max(0, index - 50), index + length + 50).trim();
    }

    detectCategory(text) {
        for (const [cat, keywords] of Object.entries(CATEGORIES)) {
            if (keywords.some(kw => text.includes(kw))) {
                return cat;
            }
        }
        return '기타';
    }

    // 페이지 내 모든 클릭 가능한 요소 찾기
    async findAllClickables(page) {
        return await page.evaluate(() => {
            const elements = [];
            const selectors = [
                'a[href]', 'button', '[onclick]', '[role="tab"]', '[role="button"]',
                '.tab', '.tabs a', '.tabs li', '.nav-tabs a', '.nav-tabs li',
                '.tab-link', '.tab-item', '.accordion-header', '.accordion-toggle',
                '[data-toggle]', '[data-target]', '.btn', '.button'
            ];

            document.querySelectorAll(selectors.join(', ')).forEach((el, i) => {
                const text = el.textContent?.trim() || '';
                const rect = el.getBoundingClientRect();

                // 화면에 보이고, 텍스트가 있는 요소만
                if (text.length > 0 && text.length < 30 && rect.width > 0 && rect.height > 0) {
                    elements.push({
                        index: i,
                        text: text,
                        tagName: el.tagName,
                        className: el.className,
                        href: el.href || null,
                        visible: rect.top >= 0 && rect.top < window.innerHeight
                    });
                }
            });

            return elements;
        });
    }

    // 딥 크롤링 - 페이지 내 모든 요소 클릭
    async deepCrawlPage(page, url) {
        const allPrices = [];
        const visitedUrls = new Set([url]);
        const clickedTexts = new Set();

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
            await page.waitForTimeout(1500);

            const baseUrl = new URL(url).origin;
            const hostname = new URL(url).hostname;

            // 1. 메인 페이지 가격 추출 (원천 텍스트 + 구조형 테이블)
            const [mainBodyText, mainStructuralPrices] = await Promise.all([
                page.evaluate(() => document.body.innerText),
                this.extractFromTables(page)
            ]);

            const mainPrices = [...this.extractPrices(mainBodyText), ...mainStructuralPrices];
            allPrices.push(...mainPrices);
            console.log(`    📄 메인: ${mainPrices.length}개 가격`);

            // 2. 호버해서 서브메뉴 열기
            console.log(`    🔍 메뉴 호버 탐색...`);
            const menus = await page.$$('nav li, .gnb li, header nav li, .menu li');
            for (const menu of menus.slice(0, 10)) {
                try {
                    await menu.hover();
                    await page.waitForTimeout(300);
                } catch (e) { }
            }
            await page.waitForTimeout(500);

            // 3. 모든 링크 수집 및 탐색
            const links = await page.$$eval('a[href]', els =>
                els.map(a => ({ text: a.textContent?.trim(), href: a.href }))
                    .filter(a => a.text && a.text.length < 30)
            );

            // 중요 키워드 우선 정렬
            const priorities = ['에데나', '봉안당', '분양', '가격', '패키지', '묘지', '수목'];
            links.sort((a, b) => {
                const ap = priorities.some(k => a.text.includes(k)) ? 0 : 1;
                const bp = priorities.some(k => b.text.includes(k)) ? 0 : 1;
                return ap - bp;
            });

            console.log(`    📋 링크: ${links.length}개`);

            let pageCount = 0;
            for (const link of links) {
                if (pageCount >= CONFIG.MAX_PAGES) break;
                if (!link.href || !link.href.includes(hostname)) continue;
                if (visitedUrls.has(link.href)) continue;

                visitedUrls.add(link.href);
                pageCount++;

                process.stdout.write(`    [${pageCount}] ${link.text.substring(0, 12).padEnd(12)}...`);

                try {
                    // 새창 감지하면서 클릭
                    const [newPage] = await Promise.all([
                        this.context.waitForEvent('page', { timeout: 3000 }).catch(() => null),
                        page.goto(link.href, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT }).catch(() => null)
                    ]);

                    let targetPage = newPage || page;
                    if (newPage) {
                        await newPage.waitForLoadState('domcontentloaded');
                    }

                    await targetPage.waitForTimeout(800);

                    // 페이지 가격 추출 (원천 텍스트 + 구조형 테이블)
                    const [pageText, structuralPrices] = await Promise.all([
                        targetPage.evaluate(() => document.body.innerText),
                        this.extractFromTables(targetPage)
                    ]);

                    const pagePrices = [...this.extractPrices(pageText), ...structuralPrices];

                    // 페이지 내 탭/버튼 클릭
                    const tabPrices = await this.clickAllTabs(targetPage);

                    const totalNew = pagePrices.length + tabPrices.length;
                    allPrices.push(...pagePrices, ...tabPrices);

                    console.log(` 💰 ${totalNew}개${newPage ? ' (새창)' : ''}`);

                    if (newPage) await newPage.close();

                } catch (e) {
                    console.log(` ❌`);
                }
            }

            // 4. 특수 버튼 클릭 (에데나, 봉안당 등) - 외부 도메인 새창도 탐색
            console.log(`    🖱️ 특수 버튼/새창 탐색 (외부 도메인 포함)...`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
            await page.waitForTimeout(1000);

            const specialKeywords = ['에데나', '봉안당', '둘러보기', '분양상품', '가격안내'];

            for (const keyword of specialKeywords) {
                try {
                    const elements = await page.$$(`text=${keyword}`);

                    for (const el of elements.slice(0, 3)) {
                        const elText = await el.innerText().catch(() => '');
                        if (clickedTexts.has(elText)) continue;
                        clickedTexts.add(elText);

                        process.stdout.write(`    [특수] ${keyword}...`);

                        // 새창 감지
                        const [newPage] = await Promise.all([
                            this.context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
                            el.click().catch(() => null)
                        ]);

                        if (newPage) {
                            // 새창이 열렸으면 (외부 도메인이어도 탐색!)
                            await newPage.waitForLoadState('domcontentloaded');
                            await newPage.waitForTimeout(2000);

                            const newUrl = newPage.url();
                            console.log(` → ${new URL(newUrl).hostname}`);

                            // 새창에서 가격 추출
                            const text = await newPage.evaluate(() => document.body.innerText);
                            let newPrices = this.extractPrices(text);

                            // 새창에서도 탭 클릭
                            const tabPrices = await this.clickAllTabs(newPage);
                            newPrices = [...newPrices, ...tabPrices];

                            // 새창에서도 내부 링크 탐색 (최대 10개)
                            const subLinks = await newPage.$$eval('a[href]', els =>
                                els.map(a => ({ text: a.textContent?.trim(), href: a.href }))
                                    .filter(a => a.text && a.text.length < 30)
                            );

                            const subPriorities = ['분양', '가격', '패키지', '안내', '로얄', '팰리스', '아트리움', '에덴', '루멘'];
                            subLinks.sort((a, b) => {
                                const ap = subPriorities.some(k => a.text.includes(k)) ? 0 : 1;
                                const bp = subPriorities.some(k => b.text.includes(k)) ? 0 : 1;
                                return ap - bp;
                            });

                            let subCount = 0;
                            for (const subLink of subLinks.slice(0, 10)) {
                                if (!subLink.href || subLink.href === newUrl) continue;
                                try {
                                    subCount++;
                                    process.stdout.write(`      [${subCount}] ${subLink.text.substring(0, 10)}...`);

                                    await newPage.goto(subLink.href, { waitUntil: 'domcontentloaded', timeout: 10000 });
                                    await newPage.waitForTimeout(800);

                                    const subText = await newPage.evaluate(() => document.body.innerText);
                                    const subPrices = this.extractPrices(subText);
                                    const subTabPrices = await this.clickAllTabs(newPage);

                                    newPrices.push(...subPrices, ...subTabPrices);
                                    console.log(` 💰 ${subPrices.length + subTabPrices.length}개`);
                                } catch (e) {
                                    console.log(` ❌`);
                                }
                            }

                            allPrices.push(...newPrices);
                            console.log(`      ✅ 새창 총: ${newPrices.length}개 가격`);
                            await newPage.close();
                        } else {
                            await page.waitForTimeout(1500);
                            const text = await page.evaluate(() => document.body.innerText);
                            const newPrices = this.extractPrices(text);
                            allPrices.push(...newPrices);
                            console.log(` 💰 ${newPrices.length}개`);
                        }

                        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT }).catch(() => { });
                        await page.waitForTimeout(500);
                    }
                } catch (e) {
                    console.log(` ❌`);
                }
            }

        } catch (e) {
            console.log(`    ❌ 오류: ${e.message.substring(0, 40)}`);
        }

        // 카테고리 보정
        const unique = [];
        const seen = new Set();
        for (const p of allPrices) {
            // 노이즈 계정이면 제외
            if (p.productName === '노이즈계정') continue;

            const key = p.price + (p.productName || '');
            if (!seen.has(key)) {
                seen.add(key);
                p.category = this.detectCategory(p.productName + ' ' + (p.context || ''));
                unique.push(p);
            }
        }

        return unique;
    }

    // 페이지 내 모든 탭/버튼 클릭
    async clickAllTabs(page) {
        const prices = [];
        const clickedTexts = new Set();

        try {
            // 탭/버튼 요소 찾기
            const tabSelectors = [
                '[role="tab"]', '.tab', '.tabs a', '.tabs li a', '.nav-tabs a',
                '.tab-link', '.tab-item', '.accordion-header', '.btn-tab'
            ];

            const tabs = await page.$$(tabSelectors.join(', '));

            for (const tab of tabs.slice(0, CONFIG.MAX_CLICKS_PER_PAGE)) {
                try {
                    const tabText = await tab.innerText().catch(() => '');
                    if (!tabText || tabText.length > 25 || clickedTexts.has(tabText)) continue;
                    clickedTexts.add(tabText);

                    // 탭 클릭
                    await tab.click().catch(() => { });
                    await page.waitForTimeout(800);

                    // 변경된 컨텐츠에서 가격 추출
                    const text = await page.evaluate(() => document.body.innerText);
                    const newPrices = this.extractPrices(text);
                    prices.push(...newPrices);

                } catch (e) { }
            }
        } catch (e) { }

        return prices;
    }

    // 이미지 다운로드 v2 - 배경/시설 사진만 수집
    async downloadImages(page, url, facilityNo, facilityName) {
        const images = [];
        const dir = path.join(CONFIG.IMAGES_DIR, `${facilityNo}_${facilityName.replace(/[\/\\:]/g, '_')}`);

        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT });
            await page.waitForTimeout(1000);

            // 배경/시설 이미지만 필터링
            const imgUrls = await page.evaluate(() => {
                // 제외할 키워드 (아이콘, 로고, 사람 관련)
                const excludeKeywords = [
                    'logo', 'icon', 'avatar', 'profile', 'person', 'people', 'staff', 'team',
                    'btn', 'button', 'arrow', 'nav', 'menu', 'social', 'facebook', 'instagram',
                    'twitter', 'youtube', 'kakao', 'naver', 'blog', 'sns', 'badge', 'banner_small',
                    'thumbnail', 'thumb_small', 'loading', 'spinner', 'pixel', 'spacer', 'blank'
                ];

                return Array.from(document.querySelectorAll('img'))
                    .filter(img => {
                        const src = img.src?.toLowerCase() || '';
                        const alt = img.alt?.toLowerCase() || '';
                        const width = img.naturalWidth || img.width;
                        const height = img.naturalHeight || img.height;

                        // 제외 조건
                        if (!src || !src.startsWith('http')) return false;
                        if (excludeKeywords.some(kw => src.includes(kw) || alt.includes(kw))) return false;
                        if (width < 300 || height < 200) return false; // 너무 작은 이미지 제외
                        if (width / height > 5 || height / width > 5) return false; // 너무 길쭉한 이미지 제외 (배너 등)

                        return true;
                    })
                    .map(img => img.src)
                    .slice(0, 15); // 최대 15장
            });

            for (let i = 0; i < imgUrls.length; i++) {
                try {
                    const response = await page.context().request.get(imgUrls[i]);
                    const buffer = await response.body();

                    // 파일 크기 체크 (최소 10KB 이상만 저장)
                    if (buffer.length < 10000) continue;

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
        console.log('🚀 딥 크롤러 v4 - 완전 탐색 모드');
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

            const prices = await this.deepCrawlPage(page, facility.url);
            const images = await this.downloadImages(page, facility.url, facility.no, facility.name);

            // 카테고리별 분류
            const categorized = {};
            for (const cat of Object.keys(CATEGORIES)) {
                categorized[cat] = prices.filter(p => p.category === cat);
            }
            categorized['기타'] = prices.filter(p => p.category === '기타');

            // 종교 감지를 위한 텍스트 추출 (메인 페이지 기준)
            await page.goto(facility.url, { waitUntil: 'domcontentloaded', timeout: CONFIG.PAGE_TIMEOUT }).catch(() => { });
            const bodyText = await page.evaluate(() => document.body.innerText).catch(() => '');
            const religion = this.detectReligion(bodyText);

            const result = {
                no: facility.no,
                name: facility.name,
                url: facility.url,
                religion: religion,
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
                        console.log(`         - ${p.priceText} (${p.context.substring(0, 20)}...)`);
                    });
                }
            }
            console.log(`      이미지: ${images.length}개`);

            fs.writeFileSync(CONFIG.OUTPUT_FILE, JSON.stringify(this.results, null, 2));

            await new Promise(r => setTimeout(r, CONFIG.DELAY));
        }

        await this.close();

        console.log('\n' + '='.repeat(60));
        console.log('✅ 딥 크롤링 완료!');
        console.log(`   저장: ${CONFIG.OUTPUT_FILE}`);
        console.log('='.repeat(60) + '\n');
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const start = parseInt(args[0]) || 1;
    const end = args[1] ? parseInt(args[1]) : null;

    const crawler = new DeepCrawler();
    crawler.run(start, end).catch(console.error);
}

module.exports = DeepCrawler;
