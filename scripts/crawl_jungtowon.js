const https = require('https');
const http = require('http');
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
        const mod = url.startsWith('https') ? https : http;
        mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
            const chunks = [];
            res.on('data', (c) => chunks.push(c));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                // Try EUC-KR decoding
                const html = iconv.decode(buf, 'euc-kr');
                resolve(html);
            });
            res.on('error', reject);
        }).on('error', reject);
    });
}

async function main() {
    for (const page of pages) {
        console.log(`\n${'='.repeat(60)}`);
        console.log(`📌 ${page.name} (${page.url})`);
        console.log('='.repeat(60));

        try {
            const html = await fetchPage(page.url);
            const $ = cheerio.load(html);

            // Try to find tables with pricing data
            const tables = $('table');
            console.log(`  테이블 수: ${tables.length}`);

            tables.each((i, table) => {
                const rows = $(table).find('tr');
                console.log(`\n  [테이블 ${i + 1}] (${rows.length} rows)`);
                rows.each((j, row) => {
                    const cells = $(row).find('td, th');
                    const cellTexts = [];
                    cells.each((k, cell) => {
                        cellTexts.push($(cell).text().trim().replace(/\s+/g, ' '));
                    });
                    if (cellTexts.some(t => t.length > 0)) {
                        console.log(`    ${cellTexts.join(' | ')}`);
                    }
                });
            });

            // Also try to find any price-related text content
            const bodyText = $('body').text().replace(/\s+/g, ' ').trim();

            // Search for price patterns (numbers with 만원, 원, etc)
            const priceMatches = bodyText.match(/\d[\d,]*\s*(?:만원|원|만)/g);
            if (priceMatches && priceMatches.length > 0) {
                console.log(`\n  💰 가격 관련 텍스트: ${[...new Set(priceMatches)].join(', ')}`);
            }

            // Look for div/section content that might have pricing
            const contentArea = $('.content, .sub_content, .sub_con, #content, .info_content, .room_info');
            if (contentArea.length > 0) {
                console.log(`\n  📄 콘텐츠 영역 텍스트:`);
                contentArea.each((i, el) => {
                    const text = $(el).text().replace(/\s+/g, ' ').trim();
                    if (text.length > 0 && text.length < 2000) {
                        console.log(`    ${text}`);
                    }
                });
            }

            // Dump raw body text (first 3000 chars) for debugging
            if (tables.length === 0) {
                console.log(`\n  🔍 페이지 텍스트 (첫 3000자):`);
                console.log(`    ${bodyText.substring(0, 3000)}`);
            }

        } catch (err) {
            console.log(`  ❌ 에러: ${err.message}`);
        }
    }
}

main();
