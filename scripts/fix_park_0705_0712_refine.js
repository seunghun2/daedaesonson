/**
 * park-0705, park-0712 가이드 기준 재정리
 *
 * 705 삼척시추모공원 — 유저 제공 이미지 기반
 *   가이드 적용:
 *   - grade에 핵심 정보만 (사용기간, 자격 등)
 *   - feeType ROW 레벨 (USAGE/MAINTENANCE)
 *   - 석물비·매장비는 별도 [필수] subType으로 분리
 *   - isRepresentative는 사용료 행에만
 *   - 총금액 행 제거 (프론트에서 합산 불필요)
 *
 * 712 광천사 봉안당 — 아카이브 기반
 *   가이드 적용:
 *   - 개인단/부부단 분리 필요 없음 (같은 아코디언에서 구분 가능)
 *   - 개인단 3개: A/B/C 구역 추정, 이름으로 구분
 *   - 관리비 별도 행
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const updates = [];

    // ===== 705 삼척시 추모공원 (가이드 기준 재정리) =====
    // 최초계약30년 1회연장30년 총60년사용가능
    // 기초수급자, 국가유공자 30년 면제
    const p705 = data.find(x => x.id === 'park-0705');
    if (p705) {
        p705.websiteUrl = 'https://www.samcheok.go.kr/memorial';
        p705.priceInfo.standardizedPrices = [
            // ── 일반묘지 화강암 ──
            {
                serviceType: 'BURIAL', subType: '일반묘지', groupType: '화강암 2평·3평', unit: '원', rows: [
                    // 단장 매장1기+예약1기
                    { name: '사용료 (매장1기)', price: 572000, feeType: 'USAGE', grade: '최초30년, 1회연장 총60년', isRepresentative: true },
                    { name: '관리비 (매장1기)', price: 480000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (예약1기)', price: 572000, feeType: 'USAGE', grade: '배우자 예약, 만70세 이상' },
                    { name: '관리비 (예약1기)', price: 480000, feeType: 'MAINTENANCE' },
                    // 3평형 합장
                    { name: '사용료 (3평형 합장)', price: 839000, feeType: 'USAGE' },
                    { name: '관리비 (3평형 합장)', price: 720000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]매장 작업비', groupType: '화강암 2평·3평', unit: '원', rows: [
                    { name: '매장비 (단장)', price: 370000, feeType: 'USAGE' },
                    { name: '매장비 (합장)', price: 370000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]석물', groupType: '화강암 2평·3평', unit: '원', rows: [
                    { name: '석물비 (단장)', price: 940000, feeType: 'USAGE' },
                    { name: '석물비 (3평형 합장)', price: 982000, feeType: 'USAGE' },
                ]
            },
            // ── 일반묘지 오석 ──
            {
                serviceType: 'BURIAL', subType: '일반묘지', groupType: '오석 2평·3평', unit: '원', rows: [
                    { name: '사용료 (매장1기)', price: 572000, feeType: 'USAGE', grade: '최초30년, 1회연장 총60년' },
                    { name: '관리비 (매장1기)', price: 480000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (예약1기)', price: 572000, feeType: 'USAGE', grade: '배우자 예약, 만70세 이상' },
                    { name: '관리비 (예약1기)', price: 480000, feeType: 'MAINTENANCE' },
                    // 2평형 합장 (개장유골/화장유골만)
                    { name: '2평형 합장 (개장·화장유골)', price: 50000, feeType: 'USAGE', grade: '매장비만 발생' },
                    // 3평형 합장
                    { name: '사용료 (3평형 합장)', price: 839000, feeType: 'USAGE' },
                    { name: '관리비 (3평형 합장)', price: 720000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]매장 작업비', groupType: '오석 2평·3평', unit: '원', rows: [
                    { name: '매장비 (단장)', price: 370000, feeType: 'USAGE' },
                    { name: '매장비 (2평형 합장)', price: 50000, feeType: 'USAGE' },
                    { name: '매장비 (3평형 합장)', price: 370000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '[필수]석물', groupType: '오석 2평·3평', unit: '원', rows: [
                    { name: '석물비 (단장)', price: 1118000, feeType: 'USAGE' },
                    { name: '석물비 (3평형 합장)', price: 1160000, feeType: 'USAGE' },
                    { name: '비석글씨값 (2평형 합장)', price: null, feeType: 'USAGE', grade: '별도 문의' },
                ]
            },
            // ── 자연장 ──
            {
                serviceType: 'NATURAL', subType: '자연장', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (단장)', price: 260000, feeType: 'USAGE', grade: '최초30년, 1회연장 총60년', isRepresentative: true },
                    { name: '관리비 (단장)', price: 100000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (안장1기+예약1기)', price: 520000, feeType: 'USAGE', grade: '배우자 예약, 만70세 이상' },
                    { name: '관리비 (안장+예약)', price: 200000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (합장1기)', price: 340000, feeType: 'USAGE' },
                    { name: '관리비 (합장1기)', price: 120000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (합장2기)', price: 340000, feeType: 'USAGE' },
                    { name: '관리비 (합장2기)', price: 120000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '[필수]매장 작업비', groupType: '자연장', unit: '원', rows: [
                    { name: '매장비 (단장·안장·합장1기)', price: 50000, feeType: 'USAGE' },
                    { name: '매장비 (합장2기)', price: 100000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '[필수]석물', groupType: '자연장', unit: '원', rows: [
                    { name: '석물비 (단장·안장)', price: 407000, feeType: 'USAGE' },
                    { name: '석물비 (합장)', price: 457000, feeType: 'USAGE' },
                ]
            },
            // ── 봉안당 ──
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '사용료 (개인단)', price: 236000, feeType: 'USAGE', grade: '최초30년, 1회연장 총60년', isRepresentative: true },
                    { name: '관리비 (개인단)', price: 100000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (부부단)', price: 472000, feeType: 'USAGE' },
                    { name: '관리비 (부부단)', price: 120000, feeType: 'MAINTENANCE' },
                    { name: '사용료 (무연고)', price: 118000, feeType: 'USAGE', grade: '10년계약, 행려사망자 5년' },
                    { name: '관리비 (무연고)', price: 50000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0705', p: p705, ws: true });
        console.log('✅', p705.id, p705.name, '가이드 기준 재정리');
    }

    // ===== 712 광천사 봉안당 (가이드 기준 재정리) =====
    // 아카이브: 관리비(년2만원) 개인단 300만/350만/300만, 부부단 600만
    // 개인단 3개 → A/B/C 구역 추정 (가운데 350만이 프리미엄)
    const p712 = data.find(x => x.id === 'park-0712');
    if (p712) {
        p712.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료', unit: '원', rows: [
                    { name: '개인단 (A구역)', price: 3000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '개인단 (B구역)', price: 3500000, feeType: 'USAGE' },
                    { name: '개인단 (C구역)', price: 3000000, feeType: 'USAGE' },
                    { name: '부부단', price: 6000000, feeType: 'USAGE' },
                    { name: '관리비', price: 20000, feeType: 'MAINTENANCE', grade: '연간' },
                ]
            },
        ];
        updates.push({ id: 'park-0712', p: p712 });
        console.log('✅', p712.id, p712.name, '가이드 기준 재정리');
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    // Supabase 동기화
    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.ws) ud.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
