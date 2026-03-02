/**
 * 불일치 126개 재검증 - EUC-KR 인코딩 처리 + HTML 본문 검색
 */
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const unmatched = JSON.parse(fs.readFileSync('data/facility-websites-verified.json', 'utf-8')).unmatched;
console.log('재검증 대상:', unmatched.length, '개\n');

async function fetchPage(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
        const res = await fetch(url, {
            signal: controller.signal, redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' }
        });
        // arraybuffer로 받아서 인코딩 처리
        const buf = await res.arrayBuffer();
        clearTimeout(timer);

        // UTF-8 먼저 시도
        let text = new TextDecoder('utf-8').decode(buf);

        // EUC-KR 감지: 깨진 문자가 많으면 EUC-KR로 재디코딩
        const garbled = (text.match(/[�]/g) || []).length;
        if (garbled > 5 || text.includes('charset=euc-kr') || text.includes('charset=EUC-KR')) {
            try {
                text = new TextDecoder('euc-kr').decode(buf);
            } catch (e) { }
        }

        return { ok: true, text, finalUrl: res.url };
    } catch (e) {
        clearTimeout(timer);
        return { ok: false, text: '' };
    }
}

function simplify(name) {
    return name
        .replace(/\(재\)|\(묘지\)|\(봉안\)|\(봉안당\)|재단법인\s*/g, '')
        .replace(/공원묘원|공원묘지|공설묘지|공설묘원|추모공원|봉안당|묘원|묘지|공원/g, '')
        .replace(/\s/g, '').trim();
}

function checkMatch(facName, htmlText) {
    const s = simplify(facName);
    if (!s || s.length < 2) return false;

    // HTML에서 한글 텍스트만 추출 (태그 제거)
    const plainText = htmlText.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

    // 시설명 핵심 키워드 체크
    if (plainText.includes(s)) return true;

    // 원본 이름으로도 체크
    const cleanName = facName.replace(/\(재\)|\(묘지\)|\(봉안\)|재단법인\s*/g, '').trim();
    if (cleanName.length >= 3 && plainText.includes(cleanName)) return true;

    // 핵심 단어 2글자 이상 매칭
    const words = cleanName.split(/[\s()·,]/g).filter(w => w.length >= 2);
    const matched = words.filter(w => plainText.includes(w));
    if (matched.length >= 2) return true;
    if (words.length === 1 && matched.length === 1) return true;

    return false;
}

function cleanUrl(url) {
    try {
        const u = new URL(url);
        if (u.hostname.endsWith('.go.kr') || u.hostname.endsWith('.or.kr')) return url;
        return u.origin + '/';
    } catch { return url; }
}

async function main() {
    const confirmed = [];
    const rejected = [];

    for (let i = 0; i < unmatched.length; i++) {
        const fac = unmatched[i];
        const r = await fetchPage(fac.website);

        if (r.ok) {
            const titleMatch = r.text.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
            const title = titleMatch ? titleMatch[1].trim().replace(/\s+/g, ' ').slice(0, 80) : '';
            const isMatch = checkMatch(fac.name, r.text);

            if (isMatch) {
                confirmed.push({ ...fac, pageTitle: title });
                console.log(`[${i + 1}/${unmatched.length}] ✅ ${fac.name} → "${title}"`);
            } else {
                rejected.push({ ...fac, pageTitle: title });
                console.log(`[${i + 1}/${unmatched.length}] ❌ ${fac.name} → "${title}" (관련 없음)`);
            }
        } else {
            rejected.push(fac);
            console.log(`[${i + 1}/${unmatched.length}] ❌ ${fac.name} → 접속 실패`);
        }
    }

    console.log(`\n=== 결과 ===`);
    console.log(`✅ 확인됨: ${confirmed.length}개`);
    console.log(`❌ 관련 없음: ${rejected.length}개`);

    // 확인된 것들 DB 세팅
    if (confirmed.length > 0) {
        console.log('\n🔄 DB 세팅 시작...');
        const facs = JSON.parse(fs.readFileSync('data/facilities.json', 'utf-8'));
        let set = 0;

        for (const c of confirmed) {
            const f = facs.find(x => x.id === c.id);
            if (f && !f.websiteUrl) {
                f.websiteUrl = cleanUrl(c.website);
                const { error } = await sb.from('Facility').update({ websiteUrl: f.websiteUrl }).eq('id', c.id);
                if (!error) set++;
                else console.log(`  ❌ ${c.id}: ${error.message}`);
            }
        }

        fs.writeFileSync('data/facilities.json', JSON.stringify(facs, null, 2));
        console.log(`✅ ${set}개 추가 세팅 완료!`);
    }
}

main().catch(console.error);
