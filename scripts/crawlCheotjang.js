
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    console.log('🚀 첫장(Cheotjang) 크롤링 시작...');
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    try {
        await page.goto('https://apply.cheotjang.com/burial_v_1_0_0', { waitUntil: 'networkidle2' });

        // 더보기 버튼을 몇 번 눌러서 데이터를 더 확보
        for (let i = 0; i < 5; i++) {
            const loadBtn = await page.$('#title_load');
            if (loadBtn) {
                const isVisible = await page.evaluate(el => el.offsetParent !== null, loadBtn);
                if (isVisible) {
                    console.log(`🖱️ 더보기 클릭 (${i + 1}/5)...`);
                    await page.click('#title_load');
                    await new Promise(r => setTimeout(r, 2000)); // 로딩 대기
                } else {
                    break;
                }
            } else {
                break;
            }
        }

        console.log('✅ 리스트 로딩 완료. 데이터 추출 중...');

        const facilities = await page.evaluate(() => {
            const items = document.querySelectorAll('#list_ajax li');
            const data = [];
            items.forEach(item => {
                const link = item.querySelector('a');
                if (!link) return;

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
            });
            return data;
        });

        console.log(`📦 ${facilities.length}개 데이터 확보!`);
        fs.writeFileSync(path.join(__dirname, '../cheotjang_data.json'), JSON.stringify(facilities, null, 2));

    } catch (e) {
        console.error('❌ 크롤링 에러:', e);
    }

    await browser.close();
})();
