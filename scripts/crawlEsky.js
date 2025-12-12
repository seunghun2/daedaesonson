
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🚀 e하늘 대규모 크롤러 가동 (Target: 1200 items)...');

    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // 메인 페이지 접속 (세션/쿠키 확보 및 CORS 회피)
    const url = 'https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000';
    await page.goto(url, { waitUntil: 'networkidle2' });

    console.log('✅ 페이지 접속 완료. 데이터 요청 시도...');

    // 브라우저 내에서 직접 API 호출
    const result = await page.evaluate(async () => {
        try {
            // jQuery가 있을 확률이 높음 ($)
            // Payload 구성
            const formData = new FormData();
            formData.append('pageInqCnt', '1200'); // 1200개 한방에
            formData.append('curPageNo', '1');
            formData.append('facilitygroupcd', 'TBC0700001'); // 장례식장 코드지만 일단 다 긁어옴
            // 필요한 경우 다른 코드도 추가 가능하지만 일단 이걸로

            const response = await fetch('/portal/fnlfac/fac_list.ajax', {
                method: 'POST',
                body: formData
            });

            return await response.json();
        } catch (e) {
            return { error: e.toString() };
        }
    });

    if (result && result.list) {
        console.log(`📦 대박! 총 ${result.list.length}개의 시설 데이터를 확보했습니다.`);

        // 데이터 저장
        const savePath = path.join(__dirname, '../crawled_full.json');
        fs.writeFileSync(savePath, JSON.stringify(result, null, 2));
        console.log(`💾 데이터 저장 완료: ${savePath}`);
    } else {
        console.error('❌ 데이터 확보 실패:', result);
    }

    await browser.close();
})();
