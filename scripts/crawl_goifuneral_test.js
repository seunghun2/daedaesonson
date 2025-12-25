/**
 * goifuneral.co.kr 시설 크롤링 테스트 (1~3번)
 */

const { chromium } = require('playwright');
const xlsx = require('xlsx');

async function crawlFacility(page, id) {
    const url = `https://www.goifuneral.co.kr/facilities/${id}/`;

    try {
        await page.goto(url, { timeout: 60000 });
        await page.waitForTimeout(1500);

        const is404 = await page.$('text=페이지를 찾을 수 없습니다');
        if (is404) return [];

        const name = await page.$eval('h1', el => el.textContent?.trim() || '').catch(() => '');
        if (!name) return [];

        try {
            await page.click('text=시설 사용료');
            await page.waitForTimeout(1500);
        } catch (e) { }

        const priceRows = await page.evaluate(() => {
            const rows = [];
            const priceTable = document.querySelector('table.css-8atqhb');
            if (priceTable) {
                priceTable.querySelectorAll('tbody tr').forEach(tr => {
                    const cells = tr.querySelectorAll('td');
                    if (cells.length >= 3) {
                        rows.push({
                            item: cells[0]?.textContent?.trim() || '',
                            detail: cells[1]?.textContent?.trim() || '',
                            price: cells[2]?.textContent?.trim() || ''
                        });
                    }
                });
            }
            return rows;
        });

        if (priceRows.length === 0) {
            return [{ id, name, item: '정보없음', detail: '정보없음', price: '정보없음' }];
        }

        return priceRows.map(r => ({ id, name, ...r }));
    } catch (error) {
        console.error('Error:', error.message);
        return [];
    }
}

async function main() {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const results = [];
    for (let id = 1; id <= 3; id++) {
        console.log('크롤링:', id);
        const rows = await crawlFacility(page, id);
        results.push(...rows);
        console.log(`  - ${rows.length}행 수집`);
    }

    await browser.close();

    // 엑셀 저장
    const formatted = results.map(r => ({
        '넘버': r.id,
        '이름': r.name,
        '사용료 항목': r.item,
        '사용료 내역': r.detail,
        '요금': r.price
    }));

    const ws = xlsx.utils.json_to_sheet(formatted);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, '가격목록');
    xlsx.writeFile(wb, 'data/goifuneral_test.xlsx');
    console.log('\n✅ 저장완료: data/goifuneral_test.xlsx -', results.length, '행');
}

main();
