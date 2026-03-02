/**
 * 네이버 검색 API로 시설 공식 홈페이지 자동 검색
 * 사용법: node scripts/search-websites.js
 */
const fs = require('fs');
const https = require('https');

const CLIENT_ID = '5hixfKeYSrjJ7EU0z_fx';
const CLIENT_SECRET = 'CtlTAoZY6b';

// facilities.json에서 park-0001 ~ park-0650 추출
const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'))
    .filter(f => {
        const num = parseInt(f.id.replace('park-', ''));
        return num >= 1 && num <= 650;
    })
    .sort((a, b) => a.id.localeCompare(b.id))
    .map(f => ({ id: f.id, name: f.name, isPublic: f.isPublic }));

console.log(`총 ${facilities.length}개 시설 검색 시작...`);

// 네이버 검색 API 호출
function searchNaver(query) {
    return new Promise((resolve, reject) => {
        const encodedQuery = encodeURIComponent(query);
        const options = {
            hostname: 'openapi.naver.com',
            path: `/v1/search/webkr.json?query=${encodedQuery}&display=5`,
            method: 'GET',
            headers: {
                'X-Naver-Client-Id': CLIENT_ID,
                'X-Naver-Client-Secret': CLIENT_SECRET
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// URL에서 도메인 추출
function extractDomain(url) {
    try {
        const u = new URL(url);
        return u.hostname;
    } catch {
        return '';
    }
}

// 공식 홈페이지 판별 (광고/포털/블로그 제외)
function findOfficialSite(results, facilityName) {
    if (!results?.items?.length) return '';

    // 제외할 도메인
    const excludeDomains = [
        'blog.naver.com', 'cafe.naver.com', 'youtube.com', 'youtu.be',
        'facebook.com', 'instagram.com', 'twitter.com', 'tiktok.com',
        'map.naver.com', 'place.naver.com', 'search.naver.com',
        'blog.daum.net', 'cafe.daum.net', 'map.kakao.com',
        'rightfuneral.co.kr', 'bugosms.com', 'myungdangga.co.kr',
        'goifuneral.co.kr', 'gyeongsang-portal.co.kr', 'star-queen.co.kr',
        'saramin.co.kr', 'jobkorea.co.kr', 'maptons.com',
        'daedaesonson.com', 'namu.wiki', 'wikipedia.org',
        'ko.wikipedia.org', 'news.', 'donga.com', 'chosun.com'
    ];

    for (const item of results.items) {
        const domain = extractDomain(item.link);
        if (!domain) continue;

        // 제외 도메인 체크
        const isExcluded = excludeDomains.some(ex => domain.includes(ex));
        if (isExcluded) continue;

        // 정부/지자체 사이트 (공설일 가능성)
        if (domain.endsWith('.go.kr') || domain.endsWith('.or.kr')) {
            return item.link;
        }

        // .co.kr, .com, .kr 등 일반 도메인
        if (domain.endsWith('.co.kr') || domain.endsWith('.com') || domain.endsWith('.kr') || domain.endsWith('.net')) {
            return item.link;
        }
    }

    return '';
}

// 딜레이
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 메인 실행
async function main() {
    const results = [];
    let found = 0;
    let notFound = 0;
    const startTime = Date.now();

    for (let i = 0; i < facilities.length; i++) {
        const fac = facilities[i];
        const cleanName = fac.name.replace(/\(재\)|\(묘지\)|재단법인\s*/g, '').trim();
        const query = `${cleanName} 공식홈페이지`;

        try {
            const data = await searchNaver(query);
            const url = findOfficialSite(data, cleanName);

            results.push({
                id: fac.id,
                name: fac.name,
                isPublic: fac.isPublic,
                website: url
            });

            if (url) {
                found++;
                console.log(`[${i + 1}/${facilities.length}] ✅ ${fac.name} → ${url}`);
            } else {
                notFound++;
                console.log(`[${i + 1}/${facilities.length}] ❌ ${fac.name} → 미발견`);
            }

            // 저장 (50개마다)
            if ((i + 1) % 50 === 0 || i === facilities.length - 1) {
                saveResults(results, found, notFound);
            }

        } catch (err) {
            console.error(`[${i + 1}] ⚠️ ${fac.name} 검색 실패:`, err.message);
            results.push({ id: fac.id, name: fac.name, isPublic: fac.isPublic, website: '' });
            notFound++;
        }

        // API 호출 간격 (초당 10회 제한 방지)
        await delay(150);
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ 완료! ${elapsed}초 소요`);
    console.log(`  발견: ${found}개, 미발견: ${notFound}개`);
    saveResults(results, found, notFound);
}

// 결과를 MD + JSON으로 저장
function saveResults(results, found, notFound) {
    // JSON 저장
    fs.writeFileSync('data/facility-websites.json', JSON.stringify(results, null, 2));

    // MD 저장
    let md = `# 시설 공식 홈페이지 목록 (park-0001 ~ park-0650)\n\n`;
    md += `> 네이버 검색 API 자동 수집 결과 | 발견: ${found}개, 미발견: ${notFound}개\n\n`;
    md += `| # | ID | 시설명 | 공설/사설 | 공식 홈페이지 |\n`;
    md += `|---|---|---|---|---|\n`;

    results.forEach((r, i) => {
        const pub = r.isPublic ? '공설' : '사설';
        const url = r.website || '-';
        md += `| ${i + 1} | ${r.id} | ${r.name} | ${pub} | ${url} |\n`;
    });

    fs.writeFileSync('시설_공식홈페이지_목록.md', md);
    console.log(`  → 중간 저장 완료 (${results.length}개)`);
}

main().catch(console.error);
