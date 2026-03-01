/**
 * park-0682 연화추모공원 → 공홈 http://www.yeonhwapark.co.kr/
 *
 * 봉안시설 가격 (단위: 만원)
 * ※ 관리비: 개인단 30만원(5년) / 부부단 60만원(5년) - 모든 층 공통
 * ※ 부부단 = 개인단 × 2 (전 층 동일)
 *
 * 3층 VIP실:
 *   측면: 1단 650 ~ 5단 1,200 (개인)
 *   정면: 1단 700 ~ 5단 1,300 (개인)
 *
 * 2층 극락실:
 *   측면: 1단 350 ~ 5단 750 (개인)
 *   정면: 1단 400 ~ 5단 800 (개인)
 *
 * 1층 정토실:
 *   측면: 1단 300 ~ 5단 650 (개인)
 *   정면: 1단 350 ~ 5단 700 (개인)
 *
 * 위패시설:
 *   일반실 120만 / 특별실 140만
 *   관리비: 개인단 1년 1만원(5년 선납)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0682');
    if (!p) { console.log('❌ park-0682 not found'); return; }

    p.websiteUrl = 'http://www.yeonhwapark.co.kr';
    p.priceInfo.standardizedPrices = [
        // ===== 3층 VIP실 =====
        {
            serviceType: 'BONGSAN', subType: '3층 VIP실', groupType: '측면 개인단', unit: '만원', rows: [
                { name: '7단', price: 600, feeType: 'USAGE' },
                { name: '6단', price: 950, feeType: 'USAGE' },
                { name: '5단', price: 1200, feeType: 'USAGE' },
                { name: '4단', price: 1100, feeType: 'USAGE' },
                { name: '3단', price: 1000, feeType: 'USAGE' },
                { name: '2단', price: 800, feeType: 'USAGE' },
                { name: '1단', price: 650, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '3층 VIP실', groupType: '정면 개인단', unit: '만원', rows: [
                { name: '9단', price: 400, feeType: 'USAGE' },
                { name: '8단', price: 500, feeType: 'USAGE' },
                { name: '7단', price: 650, feeType: 'USAGE' },
                { name: '6단', price: 1000, feeType: 'USAGE' },
                { name: '5단', price: 1300, feeType: 'USAGE' },
                { name: '4단', price: 1200, feeType: 'USAGE' },
                { name: '3단', price: 1000, feeType: 'USAGE' },
                { name: '2단', price: 850, feeType: 'USAGE' },
                { name: '1단', price: 700, feeType: 'USAGE' },
            ]
        },
        // ===== 2층 극락실 =====
        {
            serviceType: 'BONGSAN', subType: '2층 극락실', groupType: '측면 개인단', unit: '만원', rows: [
                { name: '7단', price: 500, feeType: 'USAGE' },
                { name: '6단', price: 700, feeType: 'USAGE' },
                { name: '5단', price: 750, feeType: 'USAGE' },
                { name: '4단', price: 700, feeType: 'USAGE' },
                { name: '3단', price: 600, feeType: 'USAGE' },
                { name: '2단', price: 450, feeType: 'USAGE' },
                { name: '1단', price: 350, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '2층 극락실', groupType: '정면 개인단', unit: '만원', rows: [
                { name: '9단', price: 300, feeType: 'USAGE' },
                { name: '8단', price: 400, feeType: 'USAGE' },
                { name: '7단', price: 550, feeType: 'USAGE' },
                { name: '6단', price: 750, feeType: 'USAGE' },
                { name: '5단', price: 800, feeType: 'USAGE', isRepresentative: true },
                { name: '4단', price: 750, feeType: 'USAGE' },
                { name: '3단', price: 650, feeType: 'USAGE' },
                { name: '2단', price: 500, feeType: 'USAGE' },
                { name: '1단', price: 400, feeType: 'USAGE' },
            ]
        },
        // ===== 1층 정토실 =====
        {
            serviceType: 'BONGSAN', subType: '1층 정토실', groupType: '측면 개인단', unit: '만원', rows: [
                { name: '9단', price: 200, feeType: 'USAGE' },
                { name: '8단', price: 300, feeType: 'USAGE' },
                { name: '7단', price: 450, feeType: 'USAGE' },
                { name: '6단', price: 600, feeType: 'USAGE' },
                { name: '5단', price: 650, feeType: 'USAGE' },
                { name: '4단', price: 600, feeType: 'USAGE' },
                { name: '3단', price: 500, feeType: 'USAGE' },
                { name: '2단', price: 400, feeType: 'USAGE' },
                { name: '1단', price: 300, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '1층 정토실', groupType: '정면 개인단', unit: '만원', rows: [
                { name: '9단', price: 250, feeType: 'USAGE' },
                { name: '8단', price: 350, feeType: 'USAGE' },
                { name: '7단', price: 500, feeType: 'USAGE' },
                { name: '6단', price: 650, feeType: 'USAGE' },
                { name: '5단', price: 700, feeType: 'USAGE' },
                { name: '4단', price: 650, feeType: 'USAGE' },
                { name: '3단', price: 550, feeType: 'USAGE' },
                { name: '2단', price: 450, feeType: 'USAGE' },
                { name: '1단', price: 350, feeType: 'USAGE' },
            ]
        },
        // ===== 관리비 (전 층 공통) =====
        {
            serviceType: 'BONGSAN', subType: '공통', groupType: '관리비 (5년 선납)', unit: '만원', rows: [
                { name: '개인단', price: 30, feeType: 'MAINTENANCE' },
                { name: '부부단', price: 60, feeType: 'MAINTENANCE' },
            ]
        },
        // ===== 위패시설 =====
        {
            serviceType: 'OTHER', subType: '위패시설', groupType: '사용료', unit: '만원', rows: [
                { name: '일반실', price: 120, feeType: 'USAGE' },
                { name: '특별실', price: 140, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'OTHER', subType: '위패시설', groupType: '관리비', unit: '만원', rows: [
                { name: '개인단 (1년 1만원, 5년 선납)', price: 5, feeType: 'MAINTENANCE' },
            ]
        },
    ];

    // NOTE: 부부단 = 개인단 × 2 전 층 동일, 별도 그룹 생략 (grade에 표기)
    // grade 추가
    p.priceInfo.standardizedPrices.forEach(g => {
        if (g.subType.includes('층') && g.groupType.includes('개인단')) {
            g.groupType += ' (부부단은 2배)';
        }
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅', p.id, p.name);
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility').update({
        pricing: JSON.stringify(p.priceInfo),
        websiteUrl: p.websiteUrl
    }).eq('id', 'park-0682');
    if (error) console.log('❌', error.message);
    else console.log('☁️ park-0682 Supabase 동기화 완료');
}
fix();
