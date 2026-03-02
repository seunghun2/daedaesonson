/**
 * 공식 홈페이지 검증 스크립트 v2
 * - SSL 인증서 무시 + 리다이렉트 처리 개선
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/facility-websites.json', 'utf-8'));

// 포털/중개사이트 (제외)
const portalDomains = [
    '114.co.kr', 'k114.co.kr', 'metropolitan-funeral.co.kr', 'funeral.easehub.co.kr',
    'endingsketch.com', 'ch-funeralportal.co.kr', 'rightfuneral.co.kr', 'bugosms.com',
    'fclh.purpleo.co.kr', '15774129.go.kr', 'boram.com', 'law.go.kr', 'grandculture.net',
    'visitkorea.or.kr', 'maptons.com', 'star-queen.co.kr', 'myungdangga.co.kr',
    'goifuneral.co.kr', 'saramin.co.kr', 'jobkorea.co.kr', 'namu.wiki', 'wikipedia.org',
    'youtube.com', 'blog.naver.com', 'cafe.naver.com', 'donga.com', 'chosun.com',
    'joongang.co.kr', 'gyeongsang-portal.co.kr', 'kakao.com', 'daedaesonson.com',
    'gsilbo.co.kr', 'kyongbuk.co.kr', 'picosoft.kr', 'fgpray.com', 'sarangjeil.kr',
];

const targets = data.filter(f => {
    if (!f.website) return false;
    return !portalDomains.some(p => f.website.includes(p));
});

console.log('검증 대상:', targets.length, '개');

// fetch with redirect + timeout
async function fetchWithTimeout(url, timeoutMs = 8000) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
        });
        const text = await res.text();
        clearTimeout(timer);
        const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ').slice(0, 100) : '';
        return { ok: true, status: res.status, title, finalUrl: res.url };
    } catch (e) {
        clearTimeout(timer);
        return { ok: false, status: e.name === 'AbortError' ? 'timeout' : 'error', title: '', finalUrl: '' };
    }
}

function simplify(name) {
    return name.replace(/\(재\)|\(묘지\)|재단법인\s*|공원묘원|공원묘지|공설묘지|공설묘원|추모공원|봉안당|묘원|묘지|공원|\s/g, '');
}

function isMatch(facName, pageTitle) {
    if (!pageTitle) return false;
    const s1 = simplify(facName);
    const s2 = pageTitle.replace(/\s/g, '');
    if (s1.length >= 2 && s2.includes(s1)) return true;
    const words = pageTitle.split(/[\s\-|·,():]/).filter(w => w.length >= 2);
    return words.some(w => facName.includes(w));
}

async function main() {
    const verified = [], unmatched = [], errors = [];

    for (let i = 0; i < targets.length; i++) {
        const f = targets[i];
        const r = await fetchWithTimeout(f.website);

        if (r.ok && isMatch(f.name, r.title)) {
            verified.push({ ...f, pageTitle: r.title });
            console.log(`[${i + 1}/${targets.length}] ✅ ${f.name} → "${r.title}"`);
        } else if (r.ok) {
            unmatched.push({ ...f, pageTitle: r.title });
            console.log(`[${i + 1}/${targets.length}] ⚠️ ${f.name} → "${r.title}"`);
        } else {
            errors.push({ ...f, status: r.status });
            console.log(`[${i + 1}/${targets.length}] ❌ ${f.name} → ${r.status}`);
        }

        // 50개마다 중간 저장
        if ((i + 1) % 50 === 0) saveMd(verified, unmatched, errors);
    }

    saveMd(verified, unmatched, errors);
    fs.writeFileSync('data/facility-websites-verified.json', JSON.stringify({ verified, unmatched, errors }, null, 2));
    console.log('\n=== 완료 ===');
    console.log('✅ 검증:', verified.length, '| ⚠️ 불일치:', unmatched.length, '| ❌ 오류:', errors.length);
}

function saveMd(v, u, e) {
    let md = `# 검증된 공식 홈페이지 목록\n\n`;
    md += `> ✅ ${v.length}개 검증 | ⚠️ ${u.length}개 수동확인 필요 | ❌ ${e.length}개 오류\n\n`;

    md += `## ✅ 검증 완료 (${v.length}개)\n| # | ID | 시설명 | 홈페이지 | 페이지 제목 |\n|---|---|---|---|---|\n`;
    v.forEach((r, i) => { md += `| ${i + 1} | ${r.id} | ${r.name} | ${r.website} | ${r.pageTitle} |\n`; });

    md += `\n## ⚠️ 수동 확인 필요 (${u.length}개)\n| # | ID | 시설명 | URL | 페이지 제목 |\n|---|---|---|---|---|\n`;
    u.forEach((r, i) => { md += `| ${i + 1} | ${r.id} | ${r.name} | ${r.website} | ${r.pageTitle} |\n`; });

    md += `\n## ❌ 접속 오류 (${e.length}개)\n| # | ID | 시설명 | URL | 상태 |\n|---|---|---|---|---|\n`;
    e.forEach((r, i) => { md += `| ${i + 1} | ${r.id} | ${r.name} | ${r.website} | ${r.status} |\n`; });

    fs.writeFileSync('시설_공식홈페이지_검증결과.md', md);
}

main();
