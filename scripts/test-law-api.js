const https = require('https');
const http = require('http');
const fs = require('fs');

const testRegions = ['보은군', '가평군', '강릉시', '거제시', '논산시'];

function fetchUrl(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

async function searchOrdinance(region) {
    // law.go.kr API로 조례 검색
    const query = encodeURIComponent(region + ' 장사시설');
    const url = `http://www.law.go.kr/DRF/lawSearch.do?OC=test&target=ordin&type=JSON&query=${query}`;

    console.log(`검색: ${region}`);

    try {
        const result = await fetchUrl(url);
        const data = JSON.parse(result);

        if (data.OrdinSearch && data.OrdinSearch.ordin) {
            const ordins = Array.isArray(data.OrdinSearch.ordin)
                ? data.OrdinSearch.ordin
                : [data.OrdinSearch.ordin];

            // 장사시설 조례 찾기
            const match = ordins.find(o =>
                o.법규명 && o.법규명.includes(region) && o.법규명.includes('장사시설')
            );

            if (match) {
                console.log(`  ✓ 발견: ${match.법규명}`);
                console.log(`    자치법규ID: ${match.자치법규ID}`);
                return {
                    region,
                    name: match.법규명,
                    id: match.자치법규ID,
                    status: 'found'
                };
            }
        }

        console.log(`  ✗ 조례 없음`);
        return { region, status: 'not_found' };
    } catch (err) {
        console.log(`  에러: ${err.message}`);
        return { region, status: 'error', error: err.message };
    }
}

async function main() {
    const results = [];

    for (const region of testRegions) {
        const result = await searchOrdinance(region);
        results.push(result);
    }

    console.log('\n=== 결과 ===');
    console.log(JSON.stringify(results, null, 2));

    fs.writeFileSync('data/ordinance_api_test.json', JSON.stringify(results, null, 2));
    console.log('\n저장 완료: data/ordinance_api_test.json');
}

main();
