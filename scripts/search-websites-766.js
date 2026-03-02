/**
 * park-0766~ 시설 공식 홈페이지 검색 + 검증 + DB 세팅 통합 스크립트
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const CLIENT_ID = '5hixfKeYSrjJ7EU0z_fx';
const CLIENT_SECRET = 'CtlTAoZY6b';

// 포털/중개 도메인 (제외)
const portalDomains = [
    '114.co.kr', 'k114.co.kr', 'metropolitan-funeral.co.kr', 'funeral.easehub.co.kr',
    'endingsketch.com', 'ch-funeralportal.co.kr', 'rightfuneral.co.kr', 'bugosms.com',
    'fclh.purpleo.co.kr', '15774129.go.kr', 'boram.com', 'law.go.kr', 'grandculture.net',
    'visitkorea.or.kr', 'maptons.com', 'star-queen.co.kr', 'myungdangga.co.kr',
    'goifuneral.co.kr', 'saramin.co.kr', 'jobkorea.co.kr', 'namu.wiki', 'wikipedia.org',
    'youtube.com', 'blog.naver.com', 'cafe.naver.com', 'donga.com', 'chosun.com',
    'joongang.co.kr', 'gyeongsang-portal.co.kr', 'kakao.com', 'daedaesonson.com',
    'gsilbo.co.kr', 'kyongbuk.co.kr', 'picosoft.kr', 'fgpray.com', 'sarangjeil.kr',
    'boramsangjo.com', 'boramlife.com', 'boramsangjosiloam.com', 'boramplus.com',
    'hysangjo.co.kr', 'apply.cheotjang.com', 'web.amarketing.co.kr', 'eworld.kr',
    'wjmbc.co.kr', 'idaegu.com', 'hsilbo.com', 'gnfilm.or.kr', 'oc.nonghyup.com',
    'data.go.kr', 'brunch.co.kr', 'nrich.go.kr',
];

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
const targets = facilities
    .filter(f => {
        const n = parseInt(f.id.replace('park-', ''));
        return n >= 766 && !f.websiteUrl;
    })
    .sort((a, b) => a.id.localeCompare(b.id));

console.log(`검색 대상: ${targets.length}개 (766번~ websiteUrl 없는 것)\n`);

// 네이버 검색 API
function searchNaver(query) {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: 'openapi.naver.com',
            path: `/v1/search/webkr.json?query=${encodeURIComponent(query)}&display=5`,
            headers: { 'X-Naver-Client-Id': CLIENT_ID, 'X-Naver-Client-Secret': CLIENT_SECRET }
        };
        https.get(opts, res => {
            let d = '';
            res.on('data', c => d += c);
            res.on('end', () => { try { resolve(JSON.parse(d)); } catch (e) { reject(e); } });
        }).on('error', reject);
    });
}

function extractDomain(url) { try { return new URL(url).hostname; } catch { return ''; } }

function findOfficialSite(results) {
    if (!results?.items?.length) return '';
    for (const item of results.items) {
        const domain = extractDomain(item.link);
        if (!domain) continue;
        if (portalDomains.some(p => domain.includes(p))) continue;
        if (domain.endsWith('.go.kr') || domain.endsWith('.or.kr') ||
            domain.endsWith('.co.kr') || domain.endsWith('.com') ||
            domain.endsWith('.kr') || domain.endsWith('.net')) {
            return item.link;
        }
    }
    return '';
}

// 페이지 검증
async function verifyUrl(url, facName) {
    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(url, {
            signal: controller.signal, redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' }
        });
        const buf = await res.arrayBuffer();
        clearTimeout(timer);
        let text = new TextDecoder('utf-8').decode(buf);
        if ((text.match(/[�]/g) || []).length > 5 || text.includes('charset=euc-kr')) {
            try { text = new TextDecoder('euc-kr').decode(buf); } catch { }
        }
        const s = facName.replace(/\(재\)|\(묘지\)|\(봉안\)|재단법인\s*/g, '')
            .replace(/공원묘원|공원묘지|공설묘지|추모공원|봉안당|묘원|묘지|공원/g, '')
            .replace(/\s/g, '');
        const plain = text.replace(/<[^>]+>/g, ' ');
        return s.length >= 2 && plain.includes(s);
    } catch { return false; }
}

function cleanUrl(url) {
    try {
        const u = new URL(url);
        if (u.hostname.endsWith('.go.kr') || u.hostname.endsWith('.or.kr')) return url;
        return u.origin + '/';
    } catch { return url; }
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function main() {
    let found = 0, verified = 0, set = 0;

    for (let i = 0; i < targets.length; i++) {
        const fac = targets[i];
        const cleanName = fac.name.replace(/\(재\)|\(묘지\)|재단법인\s*/g, '').trim();

        try {
            const data = await searchNaver(`${cleanName} 공식홈페이지`);
            const url = findOfficialSite(data);

            if (!url) {
                console.log(`[${i + 1}/${targets.length}] ❌ ${fac.name} → 미발견`);
                await delay(150);
                continue;
            }
            found++;

            // 검증
            const isValid = await verifyUrl(url, fac.name);
            if (!isValid) {
                console.log(`[${i + 1}/${targets.length}] ⚠️ ${fac.name} → ${url} (불일치, 스킵)`);
                await delay(150);
                continue;
            }
            verified++;

            // DB 세팅
            const cleanedUrl = cleanUrl(url);
            fac.websiteUrl = cleanedUrl;
            const { error } = await sb.from('Facility').update({ websiteUrl: cleanedUrl }).eq('id', fac.id);
            if (!error) {
                set++;
                console.log(`[${i + 1}/${targets.length}] ✅ ${fac.name} → ${cleanedUrl}`);
            } else {
                console.log(`[${i + 1}/${targets.length}] ❌ ${fac.name} DB오류: ${error.message}`);
            }
        } catch (e) {
            console.log(`[${i + 1}/${targets.length}] ❌ ${fac.name} 오류: ${e.message}`);
        }

        await delay(150);

        // 100개마다 JSON 저장
        if ((i + 1) % 100 === 0) {
            fs.writeFileSync('data/facilities.json', JSON.stringify(facilities, null, 2));
            console.log(`  → 중간 저장 (${i + 1}/${targets.length})`);
        }
    }

    // 최종 저장
    fs.writeFileSync('data/facilities.json', JSON.stringify(facilities, null, 2));
    console.log(`\n=== 완료 ===`);
    console.log(`검색: ${found}개 발견 | 검증: ${verified}개 통과 | DB 세팅: ${set}개`);
}

main().catch(console.error);
