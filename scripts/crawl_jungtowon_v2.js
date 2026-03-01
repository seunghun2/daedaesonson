const https = require('https');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

const pages = [
    { name: '연화실', url: 'https://www.jungtowon.co.kr/info/softening_room.php' },
    { name: '특별실', url: 'https://www.jungtowon.co.kr/info/special_room.php' },
    { name: '미타실', url: 'https://www.jungtowon.co.kr/info/mitasil.php' },
    { name: '준특별실', url: 'https://www.jungtowon.co.kr/info/semi_special.php' },
    { name: '극락전', url: 'https://www.jungtowon.co.kr/info/geukrak.php' },
    { name: '반야실', url: 'https://www.jungtowon.co.kr/info/banya.php' },
    { name: '마하실', url: 'https://www.jungtowon.co.kr/info/maha.php' },
];

function fetchPage(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => resolve(iconv.decode(Buffer.concat(chunks), 'euc-kr')));
            res.on('error', reject);
        }).on('error', reject);
    });
}

function extractPriceTable($) {
    const results = [];

    // Find the deepest tables (no nested tables inside)
    $('table').each((i, table) => {
        const $table = $(table);
        // Skip tables that contain other tables
        if ($table.find('table').length > 0) return;

        const rows = [];
        $table.find('tr').each((j, tr) => {
            const cells = [];
            $(tr).find('td, th').each((k, cell) => {
                cells.push($(cell).text().trim().replace(/\s+/g, ' '));
            });
            if (cells.length >= 2 && cells.some(c => c.length > 0)) {
                rows.push(cells);
            }
        });

        // Only include tables with price-like data
        if (rows.length >= 2) {
            const hasNumbers = rows.some(r => r.some(c => /^\d+$/.test(c)));
            const hasHeaders = rows.some(r => r.some(c => /단|금액|기본|확장|특별/.test(c)));
            if (hasNumbers && hasHeaders) {
                results.push(rows);
            }
        }
    });

    return results;
}

async function main() {
    const allData = {};

    for (const page of pages) {
        console.log(`\n${'='.repeat(50)}`);
        console.log(`📌 ${page.name}`);
        console.log('='.repeat(50));

        try {
            const html = await fetchPage(page.url);
            const $ = cheerio.load(html);
            const tables = extractPriceTable($);

            allData[page.name] = [];

            tables.forEach((table, idx) => {
                console.log(`\n  [가격표 ${idx + 1}]`);
                const header = table[0];
                console.log(`  ${header.join(' | ')}`);
                console.log(`  ${'─'.repeat(40)}`);

                const priceRows = [];
                for (let i = 1; i < table.length; i++) {
                    console.log(`  ${table[i].join(' | ')}`);
                    priceRows.push(table[i]);
                }

                allData[page.name].push({ header, rows: priceRows });
            });

            // Also check for management fee info
            const bodyText = $('body').text();
            const mgmtFee = bodyText.match(/관리비[^)]*[\d,]+\s*(?:만\s*)?원/g);
            if (mgmtFee) {
                console.log(`\n  💰 관리비 정보: ${[...new Set(mgmtFee)].join(', ')}`);
            }

            // Check for unit info (만원 단위)
            const unitInfo = bodyText.match(/(?:단위|가격)[^)]*(?:만원|천원)/gi);
            if (unitInfo) {
                console.log(`  📏 단위: ${[...new Set(unitInfo)].join(', ')}`);
            }

        } catch (err) {
            console.log(`  ❌ ${err.message}`);
        }
    }

    console.log('\n\n📊 크롤링 완료! 가격 데이터 요약:');
    console.log(JSON.stringify(allData, null, 2));
}

main();
