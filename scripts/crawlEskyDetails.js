
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const FILES = [
    'esky_묘지.json',
    'esky_봉안시설.json',
    'esky_자연장지.json',
    'esky_화장시설.json'
];

const LIMIT_PER_CATEGORY = 10000; // 전체 크롤링을 위해 충분히 큰 수로 설정

(async () => {
    console.log('🚀 e하늘 상세 데이터 병합 크롤링 시작 (Top 50 per category)...');

    const browser = await puppeteer.launch({
        headless: "new",
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://www.15774129.go.kr/portal/esky/fnlfac/fac_list.do?menuId=M0001000100000000', {
        waitUntil: 'networkidle2'
    });

    let pooledList = [];

    for (const filename of FILES) {
        const filePath = path.join(__dirname, `../${filename}`);
        if (!fs.existsSync(filePath)) {
            console.log(`⚠️ 파일 없음: ${filename}`);
            continue;
        }

        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        const list = data.list || [];
        // 상위 N개만
        const targetList = list.slice(0, LIMIT_PER_CATEGORY);
        console.log(`📡 ${filename.replace('esky_', '').replace('.json', '')}: ${targetList.length}/${list.length} 건 상세 조회 시작...`);

        // 브라우저 컨텍스트 내에서 병렬 처리
        const detailedList = await page.evaluate(async (items) => {
            const results = [];

            // 5개씩 끊어서 요청 (너무 빠르면 차단될 수 있음)
            const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (v, i) => arr.slice(i * size, i * size + size));
            const chunks = chunk(items, 5);

            for (const batch of chunks) {
                const promises = batch.map(async (item) => {
                    try {
                        const params = new URLSearchParams();
                        params.append('facilitycd', item.facilitycd);

                        const res = await fetch('/portal/fnlfac/fac_detail.ajax', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                            body: params
                        });
                        const json = await res.json();

                        // 기존 아이템에 detail 정보 병합
                        return {
                            ...item,
                            detail: json.detail,
                            filelist: json.filelist // 이미지 리스트
                        };
                    } catch (e) {
                        return { ...item, error: e.toString() };
                    }
                });

                const batchResults = await Promise.all(promises);
                results.push(...batchResults);

                // 딜레이
                await new Promise(r => setTimeout(r, 500));
            }
            return results;
        }, targetList);

        // 나머지(상세 조회 안 한 것들)도 리스트에 추가 (detail 없이)
        const restList = list.slice(LIMIT_PER_CATEGORY);
        pooledList = pooledList.concat(detailedList).concat(restList);

        console.log(`✅ ${filename} 처리 완료`);
    }

    // 통합 파일 저장
    fs.writeFileSync(path.join(__dirname, '../esky_full_with_details.json'), JSON.stringify({ list: pooledList }, null, 2));
    console.log(`💾 전체 통합 저장 완료: esky_full_with_details.json (총 ${pooledList.length}건)`);

    await browser.close();
})();
