const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

// 만원 → 원 변환
const M = v => v * 10000;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const park = data.find(x => x.id === 'park-0578');
    if (!park) { console.log('NOT FOUND'); return; }

    console.log('수정 전:', park.name);

    // 공식 사이트 기준 완전 재세팅
    park.priceInfo.standardizedPrices = [
        // ═══════ 신관 ═══════
        // 1층 신관 고급실 - 좌우측면단 개인
        {
            serviceType: 'BONGSAN', subType: '1층 신관 고급실', groupType: '좌우측면 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(400), feeType: 'USAGE', isRepresentative: true },
                { name: '2단', price: M(500), feeType: 'USAGE' },
                { name: '3단', price: M(600), feeType: 'USAGE' },
                { name: '4단', price: M(700), feeType: 'USAGE' },
                { name: '5단', price: M(750), feeType: 'USAGE' },
                { name: '6단', price: M(650), feeType: 'USAGE' },
                { name: '7단', price: M(500), feeType: 'USAGE' },
                { name: '8단', price: M(400), feeType: 'USAGE' },
                { name: '9단', price: M(300), feeType: 'USAGE' },
            ]
        },
        // 1층 신관 고급실 - 좌우측면단 부부
        {
            serviceType: 'BONGSAN', subType: '1층 신관 고급실', groupType: '좌우측면 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(800), feeType: 'USAGE' },
                { name: '2단', price: M(1000), feeType: 'USAGE' },
                { name: '3단', price: M(1200), feeType: 'USAGE' },
                { name: '4단', price: M(1400), feeType: 'USAGE' },
                { name: '5단', price: M(1500), feeType: 'USAGE' },
                { name: '6단', price: M(1300), feeType: 'USAGE' },
                { name: '7단', price: M(1000), feeType: 'USAGE' },
                { name: '8단', price: M(800), feeType: 'USAGE' },
                { name: '9단', price: M(600), feeType: 'USAGE' },
            ]
        },
        // 1층 신관 고급실 - 정면단 개인
        {
            serviceType: 'BONGSAN', subType: '1층 신관 고급실', groupType: '정면 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(500), feeType: 'USAGE' },
                { name: '2단', price: M(600), feeType: 'USAGE' },
                { name: '3단', price: M(700), feeType: 'USAGE' },
                { name: '4단', price: M(800), feeType: 'USAGE' },
                { name: '5단', price: M(850), feeType: 'USAGE' },
                { name: '6단', price: M(750), feeType: 'USAGE' },
                { name: '7단', price: M(600), feeType: 'USAGE' },
                { name: '8단', price: M(500), feeType: 'USAGE' },
            ]
        },
        // 1층 신관 고급실 - 정면단 부부
        {
            serviceType: 'BONGSAN', subType: '1층 신관 고급실', groupType: '정면 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(1000), feeType: 'USAGE' },
                { name: '2단', price: M(1200), feeType: 'USAGE' },
                { name: '3단', price: M(1400), feeType: 'USAGE' },
                { name: '4단', price: M(1600), feeType: 'USAGE' },
                { name: '5단', price: M(1700), feeType: 'USAGE' },
                { name: '6단', price: M(1500), feeType: 'USAGE' },
                { name: '7단', price: M(1200), feeType: 'USAGE' },
                { name: '8단', price: M(1000), feeType: 'USAGE' },
            ]
        },
        // 1층 신관 고급실 - 창측 개인
        {
            serviceType: 'BONGSAN', subType: '1층 신관 고급실', groupType: '창측 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(550), feeType: 'USAGE' },
                { name: '2단', price: M(650), feeType: 'USAGE' },
                { name: '3단', price: M(750), feeType: 'USAGE' },
                { name: '4단', price: M(850), feeType: 'USAGE' },
                { name: '5단', price: M(950), feeType: 'USAGE' },
                { name: '6단', price: M(800), feeType: 'USAGE' },
                { name: '7단', price: M(700), feeType: 'USAGE' },
                { name: '8단', price: M(600), feeType: 'USAGE' },
            ]
        },
        // 1층 신관 고급실 - 창측 부부
        {
            serviceType: 'BONGSAN', subType: '1층 신관 고급실', groupType: '창측 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(1100), feeType: 'USAGE' },
                { name: '2단', price: M(1300), feeType: 'USAGE' },
                { name: '3단', price: M(1500), feeType: 'USAGE' },
                { name: '4단', price: M(1700), feeType: 'USAGE' },
                { name: '5단', price: M(1900), feeType: 'USAGE' },
                { name: '6단', price: M(1600), feeType: 'USAGE' },
                { name: '7단', price: M(1400), feeType: 'USAGE' },
                { name: '8단', price: M(1200), feeType: 'USAGE' },
            ]
        },

        // 2층 신관 로얄관 - 좌우측면단 개인
        {
            serviceType: 'BONGSAN', subType: '2층 신관 로얄관', groupType: '좌우측면 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(500), feeType: 'USAGE' },
                { name: '2단', price: M(600), feeType: 'USAGE' },
                { name: '3단', price: M(700), feeType: 'USAGE' },
                { name: '4단', price: M(800), feeType: 'USAGE' },
                { name: '5단', price: M(850), feeType: 'USAGE' },
                { name: '6단', price: M(750), feeType: 'USAGE' },
                { name: '7단', price: M(600), feeType: 'USAGE' },
                { name: '8단', price: M(500), feeType: 'USAGE' },
                { name: '9단', price: M(400), feeType: 'USAGE' },
            ]
        },
        // 2층 신관 로얄관 - 좌우측면단 부부
        {
            serviceType: 'BONGSAN', subType: '2층 신관 로얄관', groupType: '좌우측면 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(1000), feeType: 'USAGE' },
                { name: '2단', price: M(1200), feeType: 'USAGE' },
                { name: '3단', price: M(1400), feeType: 'USAGE' },
                { name: '4단', price: M(1600), feeType: 'USAGE' },
                { name: '5단', price: M(1700), feeType: 'USAGE' },
                { name: '6단', price: M(1500), feeType: 'USAGE' },
                { name: '7단', price: M(1200), feeType: 'USAGE' },
                { name: '8단', price: M(1000), feeType: 'USAGE' },
                { name: '9단', price: M(800), feeType: 'USAGE' },
            ]
        },
        // 2층 신관 로얄관 - 정면단 개인
        {
            serviceType: 'BONGSAN', subType: '2층 신관 로얄관', groupType: '정면 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(550), feeType: 'USAGE' },
                { name: '2단', price: M(650), feeType: 'USAGE' },
                { name: '3단', price: M(750), feeType: 'USAGE' },
                { name: '4단', price: M(850), feeType: 'USAGE' },
                { name: '5단', price: M(950), feeType: 'USAGE' },
                { name: '6단', price: M(800), feeType: 'USAGE' },
                { name: '7단', price: M(700), feeType: 'USAGE' },
                { name: '8단', price: M(600), feeType: 'USAGE' },
                { name: '9단', price: M(450), feeType: 'USAGE' },
            ]
        },
        // 2층 신관 로얄관 - 정면단 부부
        {
            serviceType: 'BONGSAN', subType: '2층 신관 로얄관', groupType: '정면 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(1100), feeType: 'USAGE' },
                { name: '2단', price: M(1300), feeType: 'USAGE' },
                { name: '3단', price: M(1500), feeType: 'USAGE' },
                { name: '4단', price: M(1700), feeType: 'USAGE' },
                { name: '5단', price: M(1900), feeType: 'USAGE' },
                { name: '6단', price: M(1600), feeType: 'USAGE' },
                { name: '7단', price: M(1400), feeType: 'USAGE' },
                { name: '8단', price: M(1200), feeType: 'USAGE' },
                { name: '9단', price: M(900), feeType: 'USAGE' },
            ]
        },

        // ═══════ 본관 ═══════
        // 1층 본관 고급실 - 좌우측면단 개인
        {
            serviceType: 'BONGSAN', subType: '1층 본관 고급실', groupType: '좌우측면 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(350), feeType: 'USAGE' },
                { name: '2단', price: M(450), feeType: 'USAGE' },
                { name: '3단', price: M(600), feeType: 'USAGE' },
                { name: '4단', price: M(650), feeType: 'USAGE' },
                { name: '5단', price: M(700), feeType: 'USAGE' },
                { name: '6단', price: M(600), feeType: 'USAGE' },
                { name: '7단', price: M(400), feeType: 'USAGE' },
                { name: '8단', price: M(300), feeType: 'USAGE' },
                { name: '9단', price: M(250), feeType: 'USAGE' },
            ]
        },
        // 1층 본관 고급실 - 좌우측면단 부부
        {
            serviceType: 'BONGSAN', subType: '1층 본관 고급실', groupType: '좌우측면 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(700), feeType: 'USAGE' },
                { name: '2단', price: M(900), feeType: 'USAGE' },
                { name: '3단', price: M(1200), feeType: 'USAGE' },
                { name: '4단', price: M(1300), feeType: 'USAGE' },
                { name: '5단', price: M(1400), feeType: 'USAGE' },
                { name: '6단', price: M(1200), feeType: 'USAGE' },
                { name: '7단', price: M(800), feeType: 'USAGE' },
                { name: '8단', price: M(600), feeType: 'USAGE' },
                { name: '9단', price: M(500), feeType: 'USAGE' },
            ]
        },
        // 1층 본관 고급실 - 정면단 개인
        {
            serviceType: 'BONGSAN', subType: '1층 본관 고급실', groupType: '정면 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(400), feeType: 'USAGE' },
                { name: '2단', price: M(500), feeType: 'USAGE' },
                { name: '3단', price: M(650), feeType: 'USAGE' },
                { name: '4단', price: M(700), feeType: 'USAGE' },
                { name: '5단', price: M(750), feeType: 'USAGE' },
                { name: '6단', price: M(650), feeType: 'USAGE' },
                { name: '7단', price: M(450), feeType: 'USAGE' },
                { name: '8단', price: M(350), feeType: 'USAGE' },
                { name: '9단', price: M(300), feeType: 'USAGE' },
            ]
        },
        // 1층 본관 고급실 - 정면단 부부
        {
            serviceType: 'BONGSAN', subType: '1층 본관 고급실', groupType: '정면 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(800), feeType: 'USAGE' },
                { name: '2단', price: M(1000), feeType: 'USAGE' },
                { name: '3단', price: M(1300), feeType: 'USAGE' },
                { name: '4단', price: M(1400), feeType: 'USAGE' },
                { name: '5단', price: M(1500), feeType: 'USAGE' },
                { name: '6단', price: M(1300), feeType: 'USAGE' },
                { name: '7단', price: M(900), feeType: 'USAGE' },
                { name: '8단', price: M(700), feeType: 'USAGE' },
                { name: '9단', price: M(600), feeType: 'USAGE' },
            ]
        },

        // 1층 본관 VIP실 - 좌우측면단 개인
        {
            serviceType: 'BONGSAN', subType: '1층 본관 VIP실', groupType: '좌우측면 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(400), feeType: 'USAGE' },
                { name: '2단', price: M(550), feeType: 'USAGE' },
                { name: '3단', price: M(700), feeType: 'USAGE' },
                { name: '4단', price: M(750), feeType: 'USAGE' },
                { name: '5단', price: M(800), feeType: 'USAGE' },
                { name: '6단', price: M(700), feeType: 'USAGE' },
                { name: '7단', price: M(500), feeType: 'USAGE' },
                { name: '8단', price: M(400), feeType: 'USAGE' },
                { name: '9단', price: M(350), feeType: 'USAGE' },
            ]
        },
        // 1층 본관 VIP실 - 좌우측면단 부부
        {
            serviceType: 'BONGSAN', subType: '1층 본관 VIP실', groupType: '좌우측면 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(800), feeType: 'USAGE' },
                { name: '2단', price: M(1100), feeType: 'USAGE' },
                { name: '3단', price: M(1400), feeType: 'USAGE' },
                { name: '4단', price: M(1500), feeType: 'USAGE' },
                { name: '5단', price: M(1600), feeType: 'USAGE' },
                { name: '6단', price: M(1400), feeType: 'USAGE' },
                { name: '7단', price: M(1000), feeType: 'USAGE' },
                { name: '8단', price: M(800), feeType: 'USAGE' },
                { name: '9단', price: M(700), feeType: 'USAGE' },
            ]
        },
        // 1층 본관 VIP실 - 정면단 개인
        {
            serviceType: 'BONGSAN', subType: '1층 본관 VIP실', groupType: '정면 개인단', unit: '원',
            rows: [
                { name: '1단', price: M(450), feeType: 'USAGE' },
                { name: '2단', price: M(600), feeType: 'USAGE' },
                { name: '3단', price: M(750), feeType: 'USAGE' },
                { name: '4단', price: M(800), feeType: 'USAGE' },
                { name: '5단', price: M(850), feeType: 'USAGE' },
                { name: '6단', price: M(750), feeType: 'USAGE' },
                { name: '7단', price: M(550), feeType: 'USAGE' },
                { name: '8단', price: M(450), feeType: 'USAGE' },
                { name: '9단', price: M(400), feeType: 'USAGE' },
            ]
        },
        // 1층 본관 VIP실 - 정면단 부부
        {
            serviceType: 'BONGSAN', subType: '1층 본관 VIP실', groupType: '정면 부부단', unit: '원',
            rows: [
                { name: '1단', price: M(900), feeType: 'USAGE' },
                { name: '2단', price: M(1200), feeType: 'USAGE' },
                { name: '3단', price: M(1500), feeType: 'USAGE' },
                { name: '4단', price: M(1600), feeType: 'USAGE' },
                { name: '5단', price: M(1700), feeType: 'USAGE' },
                { name: '6단', price: M(1500), feeType: 'USAGE' },
                { name: '7단', price: M(1100), feeType: 'USAGE' },
                { name: '8단', price: M(900), feeType: 'USAGE' },
                { name: '9단', price: M(800), feeType: 'USAGE' },
            ]
        },

        // ═══════ 관리비 (공통) ═══════
        {
            serviceType: 'BONGSAN', subType: '관리비', unit: '원',
            rows: [
                { name: '관리비(개인단/5년)', price: 250000, feeType: 'MAINTENANCE', grade: '5년' },
                { name: '관리비(부부단/5년)', price: 500000, feeType: 'MAINTENANCE', grade: '5년' },
            ]
        },
    ];

    // 확인
    console.log('\n=== 수정 후 ===');
    park.priceInfo.standardizedPrices.forEach(g => {
        console.log(`\n  [${g.serviceType}] ${g.subType} {${g.groupType || '-'}}`);
        g.rows.forEach(r => {
            const rep = r.isRepresentative ? ' ★' : '';
            console.log(`    ${r.name} = ${r.price.toLocaleString()}원${rep}`);
        });
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(park.priceInfo) })
        .eq('id', 'park-0578');
    if (error) console.log('❌', error.message);
    else console.log('\n✅ Supabase 동기화 완료');
}
fix();
