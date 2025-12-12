/**
 * 🔥 대대손손 통합 크롤러
 * 
 * 소스:
 * 1. e하늘장사정보 (공공데이터)
 * 2. 첫장 (apply.cheotjang.com)
 * 3. 명당가 (myungdangga.co.kr)
 * 
 * 목표: 3개 소스 데이터를 통합하여 DB에 저장
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// ===========================
// 1. e하늘장사정보 크롤러
// ===========================
async function crawlEsky(page) {
    console.log('📡 [e하늘] 크롤링 시작...');
    try {
        // e하늘장사정보 메인 접근 (쿠키/세션 확보)
        await page.goto('https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        console.log('✅ [e하늘] 페이지 접속 완료. API 호출 시도...');

        // 브라우저 컨텍스트 내에서 API 직접 호출
        const facilities = await page.evaluate(async () => {
            try {
                const formData = new FormData();
                formData.append('pageInqCnt', '1500'); // 충분히 큰 수
                formData.append('curPageNo', '1');
                formData.append('facilitygroupcd', ''); // 전체

                const response = await fetch('/portal/fnlfac/fac_list.ajax', {
                    method: 'POST',
                    body: formData
                });

                const json = await response.json();
                return json.list || [];
            } catch (e) {
                console.error(e);
                return [];
            }
        });

        console.log(`✅ [e하늘] ${facilities.length}개 시설 수집 완료`);
        return facilities;

    } catch (error) {
        console.error('❌ [e하늘] 크롤링 실패:', error.message);
        return [];
    }
}

// ===========================
// 2. 첫장 크롤러
// ===========================
async function crawlCheotjang(page) {
    console.log('📡 [첫장] 크롤링 시작...');
    try {
        await page.goto('https://apply.cheotjang.com/burial_v_1_0_0', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // "더보기" 버튼 클릭하여 최대한 많은 데이터 로드
        for (let i = 0; i < 10; i++) {
            try {
                // 버튼이 화면에 있는지 확인
                const loadBtn = await page.$('#title_load');
                if (!loadBtn) break;

                const isVisible = await page.evaluate(el => el.offsetParent !== null, loadBtn);
                if (!isVisible) break;

                console.log(`🖱️ [첫장] 더보기 클릭 (${i + 1}/10)...`);
                await page.click('#title_load');
                await new Promise(r => setTimeout(r, 1500)); // 로딩 대기
            } catch (e) {
                console.log('⚠️ 더보기 클릭 중단:', e.message);
                break;
            }
        }

        console.log('✅ [첫장] 리스트 확보. 데이터 추출 중...');

        const facilities = await page.evaluate(() => {
            const items = document.querySelectorAll('#list_ajax li');
            const data = [];
            items.forEach(item => {
                try {
                    const nameEl = item.querySelector('.txt1');
                    const addrEl = item.querySelector('.txt2');
                    const priceEl = item.querySelector('.price span');
                    const imgEl = item.querySelector('img');

                    if (nameEl) {
                        data.push({
                            source: 'CHEOTJANG',
                            name: nameEl.innerText.trim(),
                            address: addrEl ? addrEl.innerText.trim() : '',
                            priceMin: priceEl ? parseInt(priceEl.innerText.replace(/,/g, '')) : 0,
                            imageUrl: imgEl ? imgEl.src : '',
                            tags: Array.from(item.querySelectorAll('.tag span')).map(s => s.innerText.trim())
                        });
                    }
                } catch (e) { }
            });
            return data;
        });

        console.log(`✅ [첫장] ${facilities.length}개 시설 수집 완료`);
        return facilities;

    } catch (error) {
        console.error('❌ [첫장] 크롤링 실패:', error.message);
        return [];
    }
}

// ===========================
// 3. 명당가 크롤러
// ===========================
async function crawlMyungdangga(page) {
    console.log('📡 [명당가] 크롤링 시작...');
    try {
        await page.goto('https://myungdangga.co.kr/search', {
            waitUntil: 'networkidle2',
            timeout: 60000
        });

        // Infinite Scroll (5회 정도 스크롤)
        for (let i = 0; i < 5; i++) {
            console.log(`📜 [명당가] 스크롤 다운 (${i + 1}/5)...`);
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log('✅ [명당가] 데이터 추출 중...');

        const facilities = await page.evaluate(() => {
            const items = [];
            // 명당가는 링크 구조가 href="/mourning/..."
            const links = Array.from(document.querySelectorAll('a[href^="/mourning/"]'));

            links.forEach(link => {
                // 중복 제거를 위해 ID 추출 (링크에서)
                // href="/mourning/123"
                const id = link.getAttribute('href').split('/').pop();

                const nameNode = link.querySelector('.truncate');
                const priceNode = link.querySelector('.font-bold.text-lg'); // "100만원~" 등
                const imgNode = link.querySelector('img');

                if (nameNode) {
                    let priceVal = 0;
                    if (priceNode) {
                        priceVal = parseInt(priceNode.innerText.replace(/[^0-9]/g, '')) || 0;
                    }

                    items.push({
                        source: 'MYUNGDANGGA',
                        id: id,
                        name: nameNode.innerText.trim(),
                        priceMin: priceVal,
                        imageUrl: imgNode ? imgNode.src : '',
                        link: `https://myungdangga.co.kr${link.getAttribute('href')}`
                    });
                }
            });

            // ID 기준 중복 제거
            const unique = [];
            const ids = new Set();
            items.forEach(item => {
                if (!ids.has(item.id)) {
                    ids.add(item.id);
                    unique.push(item);
                }
            });
            return unique;
        });

        console.log(`✅ [명당가] ${facilities.length}개 시설 수집 완료`);
        return facilities;

    } catch (error) {
        console.error('❌ [명당가] 크롤링 실패:', error.message);
        return [];
    }
}

// ===========================
// 메인 실행
// ===========================
(async () => {
    console.log('🚀 대대손손 통합 크롤러 시작\n');

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const allData = {
        esky: [],
        cheotjang: [],
        myungdangga: []
    };

    try {
        // 1. e하늘 크롤링
        allData.esky = await crawlEsky(page);
        await new Promise(r => setTimeout(r, 2000));

        // 2. 첫장 크롤링
        allData.cheotjang = await crawlCheotjang(page);
        await new Promise(r => setTimeout(r, 2000));

        // 3. 명당가 크롤링
        allData.myungdangga = await crawlMyungdangga(page);

        // 결과 저장
        const outputPath = path.join(__dirname, '../data/crawled_all.json');
        fs.writeFileSync(outputPath, JSON.stringify(allData, null, 2));

        console.log('\n✅ 크롤링 완료!');
        console.log(`📊 총 수집: ${allData.esky.length + allData.cheotjang.length + allData.myungdangga.length}개`);
        console.log(`💾 저장위치: ${outputPath}`);

    } catch (error) {
        console.error('❌ 크롤링 오류:', error);
    } finally {
        await browser.close();
    }
})();
