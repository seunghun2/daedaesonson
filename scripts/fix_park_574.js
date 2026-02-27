const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const park = data.find(x => x.id === 'park-0574');
    if (!park) { console.log('NOT FOUND: park-0574'); return; }

    console.log('=== 수정 전 ===');
    console.log('이름:', park.name);
    console.log('기존 그룹 수:', (park.priceInfo?.standardizedPrices || []).length);

    // 이미지 기반 완전 새로 세팅
    park.priceInfo.standardizedPrices = [
        // ── 일반실(불교/유교) 개인 ──
        {
            serviceType: 'BONGSAN',
            subType: '일반실(불교/유교)',
            groupType: '개인',
            unit: '원',
            rows: [
                { name: '1단', price: 2000000, feeType: 'USAGE', grade: '기간제 봉안' },
                { name: '2단', price: 3000000, feeType: 'USAGE' },
                { name: '3단', price: 3500000, feeType: 'USAGE' },
                { name: '4단', price: 3500000, feeType: 'USAGE' },
                { name: '5단', price: 3500000, feeType: 'USAGE' },
                { name: '6단', price: 3500000, feeType: 'USAGE' },
                { name: '7단', price: 3000000, feeType: 'USAGE' },
                { name: '8단', price: 2500000, feeType: 'USAGE' },
                { name: '9단', price: 1500000, feeType: 'USAGE', isRepresentative: true },
            ]
        },
        // ── 일반실(불교/유교) 부부단 ──
        {
            serviceType: 'BONGSAN',
            subType: '일반실(불교/유교)',
            groupType: '부부단',
            unit: '원',
            rows: [
                { name: '1단', price: 4000000, feeType: 'USAGE', grade: '기간제 봉안' },
                { name: '2단', price: 6000000, feeType: 'USAGE' },
                { name: '3단', price: 7000000, feeType: 'USAGE' },
                { name: '4단', price: 7000000, feeType: 'USAGE' },
                { name: '5단', price: 7000000, feeType: 'USAGE' },
                { name: '6단', price: 7000000, feeType: 'USAGE' },
                { name: '7단', price: 6000000, feeType: 'USAGE' },
                { name: '8단', price: 5000000, feeType: 'USAGE' },
                { name: '9단', price: 3000000, feeType: 'USAGE' },
            ]
        },
        // ── 특별실(기독교/불교/유교) 개인 ──
        {
            serviceType: 'BONGSAN',
            subType: '특별실(기독교/불교/유교)',
            groupType: '개인',
            unit: '원',
            rows: [
                { name: '1단', price: 2500000, feeType: 'USAGE', grade: '영구 봉안' },
                { name: '2단', price: 3500000, feeType: 'USAGE' },
                { name: '3단', price: 4000000, feeType: 'USAGE' },
                { name: '4단', price: 4000000, feeType: 'USAGE' },
                { name: '5단', price: 4000000, feeType: 'USAGE' },
                { name: '6단', price: 4000000, feeType: 'USAGE' },
                { name: '7단', price: 3500000, feeType: 'USAGE' },
                { name: '8단', price: 3000000, feeType: 'USAGE' },
                { name: '9단', price: 1800000, feeType: 'USAGE' },
                { name: '관리비', price: 480000, feeType: 'MAINTENANCE', grade: '10년 선납' },
            ]
        },
        // ── 특별실(기독교/불교/유교) 부부단 ──
        {
            serviceType: 'BONGSAN',
            subType: '특별실(기독교/불교/유교)',
            groupType: '부부단',
            unit: '원',
            rows: [
                { name: '1단', price: 5000000, feeType: 'USAGE', grade: '영구 봉안' },
                { name: '2단', price: 7000000, feeType: 'USAGE' },
                { name: '3단', price: 8000000, feeType: 'USAGE' },
                { name: '4단', price: 8000000, feeType: 'USAGE' },
                { name: '5단', price: 8000000, feeType: 'USAGE' },
                { name: '6단', price: 8000000, feeType: 'USAGE' },
                { name: '7단', price: 7000000, feeType: 'USAGE' },
                { name: '8단', price: 6000000, feeType: 'USAGE' },
                { name: '9단', price: 3600000, feeType: 'USAGE' },
                { name: '관리비', price: 480000, feeType: 'MAINTENANCE', grade: '10년 선납' },
            ]
        },
        // ── 불교(보은관) 행사접수 ──
        {
            serviceType: 'OTHER',
            subType: '불교(보은관) 행사접수',
            unit: '원',
            rows: [
                { name: '1재(막재)', price: 3000000, feeType: 'USAGE', grade: '바라공양 별도 30만원 추가' },
                { name: '2재(입,막재)', price: 3500000, feeType: 'USAGE' },
                { name: '3재(입,3,막재)', price: 4000000, feeType: 'USAGE' },
                { name: '7재(77재)', price: 5500000, feeType: 'USAGE' },
                { name: '영구위패(개인)', price: 300000, feeType: 'USAGE' },
                { name: '영구위패(부부)', price: 500000, feeType: 'USAGE' },
            ]
        },
        // ── 석가탄신일 행사접수 ──
        {
            serviceType: 'OTHER',
            subType: '석가탄신일 행사접수',
            unit: '원',
            rows: [
                { name: '인등', price: 100000, feeType: 'USAGE' },
                { name: '영가등', price: 100000, feeType: 'USAGE' },
                { name: '생축등', price: 100000, feeType: 'USAGE' },
                { name: '합동천도재(1위당)', price: 150000, feeType: 'USAGE' },
            ]
        },
    ];

    // 로컬 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n=== 수정 후 ===');
    console.log('새 그룹 수:', park.priceInfo.standardizedPrices.length);
    park.priceInfo.standardizedPrices.forEach(g => {
        console.log(`  [${g.serviceType}] ${g.subType} ${g.groupType || ''} → ${g.rows.length}개 항목`);
    });

    // Supabase 동기화
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(park.priceInfo) })
        .eq('id', 'park-0574');

    if (error) console.log('❌ Supabase 에러:', error.message);
    else console.log('✅ Supabase 동기화 완료');
}

fix();
