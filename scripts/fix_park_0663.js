/**
 * park-0663 약천추모공원 → 공홈 이미지 (1순위)
 * https://yakchun-mo11.imweb.me/esqa6adq
 * 약천 추모관 사용료_2026 (단위: 만원)
 *
 * [정원] 개인단/부부단 × 영구/15년 (2~7단, 1·8단은 0)
 * [숲] 개인단/부부단 × 영구/15년 (3~6단)
 * 공통: 사용료 발생시 5년 관리비 선납
 * 1/8단: 사용료0, 관리비만 납부 (정원 15년 75만, 숲 10년 50만)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const m = n => n * 10000;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0663');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'https://yakchun-mo11.imweb.me/esqa6adq';

    p.priceInfo.standardizedPrices = [
        // 정원 - 개인단 (영구)
        {
            serviceType: 'BONGSAN', subType: '정원', groupType: '개인단 (영구)', unit: '원', rows: [
                { name: '7단', price: m(150), feeType: 'USAGE' },
                { name: '6단', price: m(400), feeType: 'USAGE' },
                { name: '5단', price: m(500), feeType: 'USAGE', isRepresentative: true },
                { name: '4단', price: m(450), feeType: 'USAGE' },
                { name: '3단', price: m(400), feeType: 'USAGE' },
                { name: '2단', price: m(150), feeType: 'USAGE' },
            ]
        },
        // 정원 - 개인단 (15년)
        {
            serviceType: 'BONGSAN', subType: '정원', groupType: '개인단 (15년)', unit: '원', rows: [
                { name: '7단', price: m(100), feeType: 'USAGE' },
                { name: '6단', price: m(200), feeType: 'USAGE' },
                { name: '5단', price: m(250), feeType: 'USAGE' },
                { name: '4단', price: m(225), feeType: 'USAGE' },
                { name: '3단', price: m(200), feeType: 'USAGE' },
                { name: '2단', price: m(100), feeType: 'USAGE' },
            ]
        },
        // 정원 - 부부단 (영구)
        {
            serviceType: 'BONGSAN', subType: '정원', groupType: '부부단 (영구)', unit: '원', rows: [
                { name: '7단', price: m(300), feeType: 'USAGE' },
                { name: '6단', price: m(800), feeType: 'USAGE' },
                { name: '5단', price: m(1000), feeType: 'USAGE' },
                { name: '4단', price: m(900), feeType: 'USAGE' },
                { name: '3단', price: m(800), feeType: 'USAGE' },
                { name: '2단', price: m(300), feeType: 'USAGE' },
            ]
        },
        // 정원 - 부부단 (15년)
        {
            serviceType: 'BONGSAN', subType: '정원', groupType: '부부단 (15년)', unit: '원', rows: [
                { name: '7단', price: m(200), feeType: 'USAGE' },
                { name: '6단', price: m(400), feeType: 'USAGE' },
                { name: '5단', price: m(500), feeType: 'USAGE' },
                { name: '4단', price: m(450), feeType: 'USAGE' },
                { name: '3단', price: m(400), feeType: 'USAGE' },
                { name: '2단', price: m(200), feeType: 'USAGE' },
            ]
        },
        // 숲 - 개인단 (영구)
        {
            serviceType: 'BONGSAN', subType: '숲', groupType: '개인단 (영구)', unit: '원', rows: [
                { name: '6단', price: m(300), feeType: 'USAGE' },
                { name: '5단', price: m(350), feeType: 'USAGE' },
                { name: '4단', price: m(300), feeType: 'USAGE' },
                { name: '3단', price: m(250), feeType: 'USAGE' },
            ]
        },
        // 숲 - 개인단 (15년)
        {
            serviceType: 'BONGSAN', subType: '숲', groupType: '개인단 (15년)', unit: '원', rows: [
                { name: '6단', price: m(150), feeType: 'USAGE' },
                { name: '5단', price: m(175), feeType: 'USAGE' },
                { name: '4단', price: m(150), feeType: 'USAGE' },
                { name: '3단', price: m(100), feeType: 'USAGE' },
            ]
        },
        // 숲 - 부부단 (영구)
        {
            serviceType: 'BONGSAN', subType: '숲', groupType: '부부단 (영구)', unit: '원', rows: [
                { name: '6단', price: m(600), feeType: 'USAGE' },
                { name: '5단', price: m(700), feeType: 'USAGE' },
                { name: '4단', price: m(600), feeType: 'USAGE' },
                { name: '3단', price: m(500), feeType: 'USAGE' },
            ]
        },
        // 숲 - 부부단 (15년)
        {
            serviceType: 'BONGSAN', subType: '숲', groupType: '부부단 (15년)', unit: '원', rows: [
                { name: '6단', price: m(300), feeType: 'USAGE' },
                { name: '5단', price: m(350), feeType: 'USAGE' },
                { name: '4단', price: m(300), feeType: 'USAGE' },
                { name: '3단', price: m(200), feeType: 'USAGE' },
                { name: '관리비 (정원)', price: 750000, feeType: 'MAINTENANCE', grade: '15년 선납, 개인단 기준' },
                { name: '관리비 (숲)', price: 500000, feeType: 'MAINTENANCE', grade: '10년 선납, 개인단 기준' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0663');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
