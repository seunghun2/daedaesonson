
const puppeteer = require('puppeteer');

(async () => {
    console.log('🚀 이미지 탭 크롤링 로직 분석 시작...');
    const browser = await puppeteer.launch({
        headless: false, // 과정을 보기 위해 false
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // 1. e하늘 접속
    await page.goto('https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', { waitUntil: 'networkidle2' });

    // 2. 검색 (분당메모리얼파크 - 유명해서 사진 있을 확률 높음)
    // 검색창 ID: searchKeyword
    await page.type('#searchKeyword', '분당메모리얼파크');
    // 검색 버튼 클릭 (함수: fn_search('1'))
    await page.evaluate(() => window.fn_search('1'));

    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => { });
    await new Promise(r => setTimeout(r, 2000));

    // 3. 리스트에서 클릭
    console.log('🖱️ 시설 클릭 시도...');
    // 리스트의 첫번째 a 태그 (fn_view 포함)
    const clicked = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'));
        const target = links.find(a => a.getAttribute('onclick')?.includes('fn_view'));
        if (target) {
            target.click();
            return true;
        }
        return false;
    });

    if (!clicked) {
        console.log('❌ 시설을 찾지 못했습니다.');
        await browser.close();
        return;
    }

    await new Promise(r => setTimeout(r, 3000));

    // 4. 상세 페이지에서 "시설사진" 탭 찾기
    console.log('📸 시설사진 탭 찾기...');
    // 탭 이름이 "시설사진"인 것
    const tabClicked = await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('a, li, button, span'));
        const photoTab = tabs.find(el => el.textContent.trim() === '시설사진');
        if (photoTab) {
            photoTab.click();
            return true;
        }
        return false;
    });

    if (tabClicked) {
        console.log('✅ 시설사진 탭 클릭 성공! 로딩 대기...');
        await new Promise(r => setTimeout(r, 3000));

        // 5. 이미지 태그 찾기
        const images = await page.evaluate(() => {
            const result = [];
            // 이미지 갤러리 영역 추정 (id="photo", class="gallery" 등)
            // 또는 모든 img 태그 중 src가 'facilitypic'을 포함하는 것
            const imgs = document.querySelectorAll('img');
            imgs.forEach(img => {
                if (img.src && img.src.includes('facilitypic')) {
                    result.push(img.src);
                }
            });
            return result;
        });

        console.log(`🎉 발견된 이미지: ${images.length}개`);
        console.log(images);
    } else {
        console.log('❌ 시설사진 탭을 찾을 수 없습니다.');
    }

    await browser.close();
})();
