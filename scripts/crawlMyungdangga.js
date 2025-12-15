
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🚀 명당가(Myungdangga) 크롤링 시작...');
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        // 검색 페이지 접속 (전체 리스트)
        await page.goto('https://myungdangga.co.kr/search', { waitUntil: 'networkidle2' });

        // 스크롤 다운으로 데이터 로딩 (Infinite Scroll 가정)
        for (let i = 0; i < 3; i++) {
            await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
            await new Promise(r => setTimeout(r, 2000));
        }

        console.log('✅ 리스트 로딩 완료. 데이터 추출 중...');

        const facilities = await page.evaluate(() => {
            // Next.js 구조상 a 태그로 링크가 걸려있음
            const links = Array.from(document.querySelectorAll('a[href^="/mourning/"]'));
            const data = [];

            links.forEach(link => {
                // 부모/자식 관계 탐색
                // 이름: font-normal truncate text-grey-700 (클래스는 변할 수 있으니 텍스트 위주로?)
                // 가격: text-lg font-bold

                // 구조가 복잡하니, textContent를 다 긁어서 파싱하거나, 특정 클래스를 찾음
                const nameNode = link.querySelector('.truncate'); // 이름은 보통 truncate됨
                const priceNode = link.querySelector('.text-lg.font-bold');
                const imgNode = link.querySelector('img');

                // 지역 정보는 상단 태그에 있음. (형제 노드들이라 찾기 까다로울 수 있음)
                // 하지만 일단 이름과 가격만 있어도 성공

                if (nameNode) {
                    const priceText = priceNode ? priceNode.innerText : '0';
                    const priceVal = parseInt(priceText.replace(/[^0-9]/g, ''));

                    data.push({
                        source: 'MYUNGDANGGA',
                        id: link.getAttribute('href').split('/').pop(),
                        name: nameNode.innerText.trim(),
                        priceMin: priceVal, // 만원 단위인지 원 단위인지 확인 필요 (보통 만원)
                        imageUrl: imgNode ? imgNode.src : '',
                        link: `https://myungdangga.co.kr${link.getAttribute('href')}`
                    });
                }
            });
            // 중복 제거 (이미지와 텍스트 각각 링크가 걸려있을 수 있음)
            return data.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        });

        console.log(`📦 ${facilities.length}개 데이터 확보!`);
        fs.writeFileSync(path.join(__dirname, '../myungdangga_data.json'), JSON.stringify(facilities, null, 2));

    } catch (e) {
        console.error('❌ 크롤링 에러:', e);
    }

    await browser.close();
})();
