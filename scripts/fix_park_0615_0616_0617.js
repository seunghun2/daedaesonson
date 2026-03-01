/**
 * park-0615 양구봉안공원 봉안당 → e하늘 이미지 기준
 * park-0616 (재)지평선전북공원묘원(봉안) → e하늘 이미지 기준
 * park-0617 봉안당에데나(낙원추모공원) → 공홈 기준
 *   https://www.edena.co.kr/bbs/content.php?co_id=03_01 (프리미엄)
 *   https://www.edena.co.kr/bbs/content.php?co_id=03_02 (VIP)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const W = 10000;

async function fix() {
    const fp = path.join(__dirname, '..', 'data', 'facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    function update(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        console.log('✅', id, p.name);
    }

    // ===== park-0615 양구봉안공원 봉안당 =====
    // 공설, 관내/관외 구분, 봉안담
    update('park-0615', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안담(개인)', unit: '원',
                rows: [
                    { name: '사용료', price: 547840, feeType: 'USAGE', residency: 'LOCAL', grade: '15년 사용, 연장 15년x2회', isRepresentative: true },
                    { name: '사용료', price: 912480, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년 사용, 연장 15년x2회' },
                    { name: '관리비', price: 105000, feeType: 'MAINTENANCE', grade: '15년분 (년 7,000원)' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안담(부부)', unit: '원',
                rows: [
                    { name: '사용료', price: 824460, feeType: 'USAGE', residency: 'LOCAL', grade: '15년 사용, 연장 15년x2회' },
                    { name: '사용료', price: 1374110, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년 사용, 연장 15년x2회' },
                    { name: '관리비', price: 150000, feeType: 'MAINTENANCE', grade: '15년분 (년 10,000원)' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안담(가족/법인/단체)', unit: '원',
                rows: [
                    { name: '사용료', price: 783230, feeType: 'USAGE', residency: 'LOCAL', grade: '15년 사용, 연장 15년x3회' },
                    { name: '사용료', price: 1305400, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년 사용, 연장 15년x3회' },
                    { name: '관리비', price: 150000, feeType: 'MAINTENANCE', grade: '15년분 (년 10,000원)' },
                ]
            },
        ];
        p.priceInfo.representativePrice = 547840;
    });

    // ===== park-0616 (재)지평선전북공원묘원(봉안) =====
    // 매장묘(묘역) + 봉안묘 (야외이므로 BURIAL)
    update('park-0616', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '매화묘역', price: 1500000, feeType: 'USAGE', grade: '3.3㎡ (1평)', isRepresentative: true },
                    { name: '진달래묘역', price: 1400000, feeType: 'USAGE', grade: '3.3㎡ (1평)' },
                    { name: '개나리묘역', price: 1300000, feeType: 'USAGE', grade: '3.3㎡ (1평)' },
                    { name: '장미묘역', price: 1200000, feeType: 'USAGE', grade: '3.3㎡ (1평)' },
                    { name: '관리비', price: 15000, feeType: 'MAINTENANCE', grade: '1평 / 연간' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '봉안묘', unit: '원',
                rows: [
                    { name: '봉안2위', price: 3000000, feeType: 'USAGE', grade: '3평, 상석·비석·1회 설치비 포함' },
                    { name: '봉안4위', price: 3900000, feeType: 'USAGE', grade: '4평, 상석·비석·1회 설치비 포함' },
                    { name: '봉안12위', price: 9900000, feeType: 'USAGE', grade: '7평, 상석·비석·1회 설치비 포함' },
                    { name: '봉안24위', price: 24600000, feeType: 'USAGE', grade: '10평, 상석·비석·1회 설치비 포함' },
                ]
            },
        ];
        p.priceInfo.representativePrice = 1200000;
    });

    // ===== park-0617 봉안당에데나(낙원추모공원) =====
    // 공홈 기준, 기본형(1인) 가격, 에덴/루멘은 전화문의
    update('park-0617', p => {
        p.websiteUrl = 'https://www.edena.co.kr/bbs/content.php?co_id=03_01';
        p.priceInfo.standardizedPrices = [
            // 로얄(ROYAL)관 — 프리미엄
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '로얄(ROYAL)관', unit: '원',
                rows: [
                    { name: '8단', price: 350 * W, feeType: 'USAGE', isRepresentative: true },
                    { name: '7단', price: 400 * W, feeType: 'USAGE' },
                    { name: '6단', price: 700 * W, feeType: 'USAGE' },
                    { name: '5단', price: 700 * W, feeType: 'USAGE' },
                    { name: '4단', price: 700 * W, feeType: 'USAGE' },
                    { name: '3단', price: 600 * W, feeType: 'USAGE' },
                    { name: '2단', price: 500 * W, feeType: 'USAGE' },
                    { name: '1단', price: 500 * W, feeType: 'USAGE' },
                    { name: '관리비(기본형)', price: 4 * W, feeType: 'MAINTENANCE', grade: '연간 (5년 선납 20만원)' },
                ]
            },
            // 아트리움(ATRIUM)관 — 프리미엄
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '아트리움(ATRIUM)관', unit: '원',
                rows: [
                    { name: '8단', price: 600 * W, feeType: 'USAGE' },
                    { name: '7단', price: 700 * W, feeType: 'USAGE' },
                    { name: '6단', price: 900 * W, feeType: 'USAGE' },
                    { name: '5단', price: 1000 * W, feeType: 'USAGE' },
                    { name: '4단', price: 1000 * W, feeType: 'USAGE' },
                    { name: '3단', price: 1000 * W, feeType: 'USAGE' },
                    { name: '2단', price: 800 * W, feeType: 'USAGE' },
                    { name: '1단', price: 800 * W, feeType: 'USAGE' },
                    { name: '관리비(기본형)', price: 4 * W, feeType: 'MAINTENANCE', grade: '연간 (5년 선납 20만원)' },
                ]
            },
            // 팰리스(PALACE)관 — 프리미엄
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '팰리스(PALACE)관', unit: '원',
                rows: [
                    { name: '8단', price: 700 * W, feeType: 'USAGE' },
                    { name: '7단', price: 800 * W, feeType: 'USAGE' },
                    { name: '6단', price: 1000 * W, feeType: 'USAGE' },
                    { name: '5단', price: 1200 * W, feeType: 'USAGE' },
                    { name: '4단', price: 1200 * W, feeType: 'USAGE' },
                    { name: '3단', price: 1200 * W, feeType: 'USAGE' },
                    { name: '2단', price: 900 * W, feeType: 'USAGE' },
                    { name: '1단', price: 900 * W, feeType: 'USAGE' },
                    { name: '관리비(기본형)', price: 4 * W, feeType: 'MAINTENANCE', grade: '연간 (5년 선납 20만원)' },
                ]
            },
            // 에덴(EDEN)관 — VIP
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '에덴(EDEN)관 VIP', unit: '원',
                rows: [
                    { name: '6~2단', price: null, feeType: 'USAGE', grade: '전화문의', note: '종교행사가 가능한 프라이빗 봉안실' },
                    { name: '관리비(기본형)', price: 4 * W, feeType: 'MAINTENANCE', grade: '연간 (5년 선납 20만원)' },
                ]
            },
            // 루멘(LUMEN)관 — VIP
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '루멘(LUMEN)관 VIP', unit: '원',
                rows: [
                    { name: '6~2단', price: null, feeType: 'USAGE', grade: '전화문의', note: '외부인 출입 통제된 VIP 전용 독립 공간' },
                    { name: '관리비(기본형)', price: 4 * W, feeType: 'MAINTENANCE', grade: '연간 (5년 선납 20만원)' },
                ]
            },
        ];
        p.priceInfo.representativePrice = 3500000;
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n✅ JSON 저장 완료');

    // Supabase 동기화
    if (!SUPABASE_KEY) { console.log('⚠️ KEY 없음'); return; }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const ids = ['park-0615', 'park-0616', 'park-0617'];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        const upd = { pricing: JSON.stringify(f.priceInfo) };
        if (f.websiteUrl) upd.websiteUrl = f.websiteUrl;
        const { error } = await supabase.from('Facility').update(upd).eq('id', id);
        console.log(error ? '❌ ' + id + ' ' + error.message : '✅ ' + id + ' DB 동기화');
    }
}
fix().catch(console.error);
