/**
 * goifuneral.co.kr 시설 크롤링 스크립트
 * CSV로 저장
 * 컬럼: 넘버, 이름, 사용료 항목, 사용료 내역, 요금
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const START_ID = 1;
const END_ID = 1246;
const DELAY_MS = 300;
const OUTPUT_FILE = path.join(__dirname, '../data/goifuneral_prices.csv');
const PROGRESS_FILE = path.join(__dirname, '../data/goifuneral_progress.json');

// CSV 이스케이프 함수
function escapeCSV(value) {
    if (typeof value !== 'string') value = String(value);
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return '"' + value.replace(/"/g, '""') + '"';
    }
    return value;
}

async function crawlFacility(page, id) {
    const url = `https://www.goifuneral.co.kr/facilities/${id}/`;

    try {
        await page.goto(url, { timeout: 60000 });
        await page.waitForTimeout(1500);

        // 404 체크
        const is404 = await page.$('text=페이지를 찾을 수 없습니다');
        if (is404) {
            return [];
        }

        // 시설명 추출
        const name = await page.$eval('h1', el => el.textContent?.trim() || '').catch(() => '');
        if (!name) {
            return [];
        }

        // "시설 사용료" 탭 클릭
        try {
            await page.click('text=시설 사용료');
            await page.waitForTimeout(1500);
        } catch (e) { }

        // 가격 테이블 행 추출
        const priceRows = await page.evaluate(({ facilityId, facilityName }) => {
            const rows = [];
            const priceTable = document.querySelector('table.css-8atqhb');
            if (priceTable) {
                const tableRows = priceTable.querySelectorAll('tbody tr');
                tableRows.forEach(tr => {
                    const cells = tr.querySelectorAll('td');
                    if (cells.length >= 3) {
                        const item = cells[0]?.textContent?.trim() || '';
                        const detail = cells[1]?.textContent?.trim() || '';
                        const price = cells[2]?.textContent?.trim() || '';

                        if (item) {
                            rows.push({
                                넘버: facilityId,
                                이름: facilityName,
                                사용료항목: item,
                                사용료내역: detail,
                                요금: price
                            });
                        }
                    }
                });
            }
            return rows;
        }, { facilityId: id, facilityName: name });

        // 가격 정보 없으면 "없음"으로 기록
        if (priceRows.length === 0) {
            return [{
                넘버: id,
                이름: name,
                사용료항목: '없음',
                사용료내역: '없음',
                요금: '없음'
            }];
        }

        return priceRows;

    } catch (error) {
        console.error(`\n❌ Error crawling ${id}:`, error.message);
        return [];
    }
}

async function main() {
    console.log('🚀 goifuneral.co.kr 크롤링 시작...\n');
    console.log('📋 형식: 넘버, 이름, 사용료 항목, 사용료 내역, 요금\n');

    // 진행 상황 로드
    let progress = { lastId: 0, results: [] };
    if (fs.existsSync(PROGRESS_FILE)) {
        progress = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
        console.log(`📌 이전 진행 상황 로드: ${progress.lastId}번까지 완료 (${progress.results.length}행)`);
    }

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const results = progress.results || [];
    const startFrom = progress.lastId + 1;

    for (let id = startFrom; id <= END_ID; id++) {
        process.stdout.write(`\r📥 크롤링 중: ${id}/${END_ID} (${((id / END_ID) * 100).toFixed(1)}%) - 총 ${results.length}행`);

        const rows = await crawlFacility(page, id);
        results.push(...rows);

        // 진행 상황 저장 (10개마다)
        if (id % 10 === 0) {
            progress = { lastId: id, results };
            fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
        }

        await new Promise(r => setTimeout(r, DELAY_MS));
    }

    await browser.close();

    console.log(`\n\n✅ 크롤링 완료! 총 ${results.length}행 수집\n`);

    // CSV 저장
    if (results.length > 0) {
        const header = '넘버,이름,사용료 항목,사용료 내역,요금\n';
        const csvRows = results.map(r =>
            [r.넘버, r.이름, r.사용료항목, r.사용료내역, r.요금].map(escapeCSV).join(',')
        ).join('\n');

        fs.writeFileSync(OUTPUT_FILE, '\uFEFF' + header + csvRows, 'utf-8'); // BOM for Excel
        console.log(`📊 CSV 저장 완료: ${OUTPUT_FILE}`);
    }

    // 진행 파일 삭제
    if (fs.existsSync(PROGRESS_FILE)) {
        fs.unlinkSync(PROGRESS_FILE);
    }
}

main().catch(console.error);
