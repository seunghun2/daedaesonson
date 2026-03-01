/**
 * park-0668 전주추모관 → 공홈 (1순위)
 * https://www.jeonjumemorial.com/
 * 관리비: 1위당 5만원/년 × 10년 = 50만원 선납 (1관·2관 공통)
 *
 * [1관]
 * 2층: 부부단 500만 / 법당 700만
 * 1층: 개인단 250만 / 부부단 350만 (1~10단)
 * B1: 부부단 200만 (1~7단) / 지장보살단 250만
 *
 * [2관]
 * VIP룸(1층): 개인 750~1200만 / 부부 1600~2800만 (1~6단)
 * 특별실(2·3층): 개인 480~800만 / 부부 850~1260만 (1~8단)
 * 일반실(2·3층): 개인 380~700만 / 부부 750~1160만 (1~8단)
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

    const p = data.find(x => x.id === 'park-0668');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'https://www.jeonjumemorial.com';

    p.priceInfo.standardizedPrices = [
        // ===== 1관 =====
        // 1관 2층
        {
            serviceType: 'BONGSAN', subType: '1관 2층', groupType: '부부단', unit: '원', rows: [
                { name: '사용료 (1~8단)', price: m(500), feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '1관 2층', groupType: '법당', unit: '원', rows: [
                { name: '사용료', price: m(700), feeType: 'USAGE' },
            ]
        },
        // 1관 1층
        {
            serviceType: 'BONGSAN', subType: '1관 1층', groupType: '개인단', unit: '원', rows: [
                { name: '사용료 (1~10단)', price: m(250), feeType: 'USAGE', isRepresentative: true },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '1관 1층', groupType: '부부단', unit: '원', rows: [
                { name: '사용료 (1~10단)', price: m(350), feeType: 'USAGE' },
            ]
        },
        // 1관 B1
        {
            serviceType: 'BONGSAN', subType: '1관 B1', groupType: '부부단', unit: '원', rows: [
                { name: '사용료 (1~7단)', price: m(200), feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '1관 B1', groupType: '지장보살단', unit: '원', rows: [
                { name: '사용료', price: m(250), feeType: 'USAGE' },
            ]
        },

        // ===== 2관 =====
        // VIP룸 - 개인단
        {
            serviceType: 'BONGSAN', subType: '2관 VIP룸', groupType: '개인단', unit: '원', rows: [
                { name: '6단', price: m(750), feeType: 'USAGE', grade: '1층, 650×350' },
                { name: '5단', price: m(900), feeType: 'USAGE' },
                { name: '4단', price: m(1200), feeType: 'USAGE' },
                { name: '3단', price: m(1200), feeType: 'USAGE' },
                { name: '2단', price: m(900), feeType: 'USAGE' },
                { name: '1단', price: m(750), feeType: 'USAGE' },
            ]
        },
        // VIP룸 - 부부단
        {
            serviceType: 'BONGSAN', subType: '2관 VIP룸', groupType: '부부단', unit: '원', rows: [
                { name: '6단', price: m(1600), feeType: 'USAGE' },
                { name: '5단', price: m(2100), feeType: 'USAGE' },
                { name: '4단', price: m(2800), feeType: 'USAGE' },
                { name: '3단', price: m(2800), feeType: 'USAGE' },
                { name: '2단', price: m(2100), feeType: 'USAGE' },
                { name: '1단', price: m(1600), feeType: 'USAGE' },
            ]
        },
        // 특별실 - 개인단
        {
            serviceType: 'BONGSAN', subType: '2관 특별실', groupType: '개인단', unit: '원', rows: [
                { name: '8단', price: m(480), feeType: 'USAGE', grade: '2·3층, 600×280' },
                { name: '7단', price: m(580), feeType: 'USAGE' },
                { name: '6단', price: m(740), feeType: 'USAGE' },
                { name: '5단', price: m(800), feeType: 'USAGE' },
                { name: '4단', price: m(740), feeType: 'USAGE' },
                { name: '3단', price: m(660), feeType: 'USAGE' },
                { name: '2단', price: m(580), feeType: 'USAGE' },
                { name: '1단', price: m(520), feeType: 'USAGE' },
            ]
        },
        // 특별실 - 부부단
        {
            serviceType: 'BONGSAN', subType: '2관 특별실', groupType: '부부단', unit: '원', rows: [
                { name: '8단', price: m(850), feeType: 'USAGE' },
                { name: '7단', price: m(950), feeType: 'USAGE' },
                { name: '6단', price: m(1190), feeType: 'USAGE' },
                { name: '5단', price: m(1260), feeType: 'USAGE' },
                { name: '4단', price: m(1190), feeType: 'USAGE' },
                { name: '3단', price: m(1080), feeType: 'USAGE' },
                { name: '2단', price: m(950), feeType: 'USAGE' },
                { name: '1단', price: m(850), feeType: 'USAGE' },
            ]
        },
        // 일반실 - 개인단
        {
            serviceType: 'BONGSAN', subType: '2관 일반실', groupType: '개인단', unit: '원', rows: [
                { name: '8단', price: m(380), feeType: 'USAGE', grade: '2·3층, 550×280' },
                { name: '7단', price: m(480), feeType: 'USAGE' },
                { name: '6단', price: m(640), feeType: 'USAGE' },
                { name: '5단', price: m(700), feeType: 'USAGE' },
                { name: '4단', price: m(640), feeType: 'USAGE' },
                { name: '3단', price: m(560), feeType: 'USAGE' },
                { name: '2단', price: m(480), feeType: 'USAGE' },
                { name: '1단', price: m(420), feeType: 'USAGE' },
            ]
        },
        // 일반실 - 부부단
        {
            serviceType: 'BONGSAN', subType: '2관 일반실', groupType: '부부단', unit: '원', rows: [
                { name: '8단', price: m(750), feeType: 'USAGE' },
                { name: '7단', price: m(850), feeType: 'USAGE' },
                { name: '6단', price: m(1090), feeType: 'USAGE' },
                { name: '5단', price: m(1160), feeType: 'USAGE' },
                { name: '4단', price: m(1090), feeType: 'USAGE' },
                { name: '3단', price: m(980), feeType: 'USAGE' },
                { name: '2단', price: m(850), feeType: 'USAGE' },
                { name: '1단', price: m(750), feeType: 'USAGE' },
                // 관리비 (1관·2관 공통)
                { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '1위당 5만원/년 × 10년 선납' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0668');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
