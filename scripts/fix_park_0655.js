/**
 * park-0655 효심원 → 공홈 이미지 (1순위)
 * http://m.hyosimwon.com/main.html
 *
 * [봉안당] (만원)
 * 반지하 일반실 개인단/부부단 8~1단
 * 지상(1,2,3층) 일반실 개인단/부부단 8~1단
 * 특실(부부단) 8~1단
 * 가족·문중실 8~1단
 * 관리비: 1위당 3만원/년, 10년 선납 30만원, 영구 120만원
 *
 * [수목장]
 * 가족수목 5~10기: 500~1,200만원
 * 부부수목 2기: 300~1,000만원
 * 개인수목 1기: 300~1,000만원
 * 공동수목 12기: 100~200만원
 * 관리비: 1년 3~12만원, 10년 계약
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0655');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'http://m.hyosimwon.com/main.html';

    const m = n => n * 10000; // 만원→원

    p.priceInfo.standardizedPrices = [
        // 반지하 일반실 - 개인단
        {
            serviceType: 'BONGSAN', subType: '반지하 일반실', groupType: '개인단', unit: '원', rows: [
                { name: '8단', price: m(100), feeType: 'USAGE', isRepresentative: true },
                { name: '7단', price: m(150), feeType: 'USAGE' },
                { name: '6단', price: m(250), feeType: 'USAGE' },
                { name: '5단', price: m(350), feeType: 'USAGE' },
                { name: '4단', price: m(350), feeType: 'USAGE' },
                { name: '3단', price: m(250), feeType: 'USAGE' },
                { name: '2단', price: m(200), feeType: 'USAGE' },
                { name: '1단', price: m(150), feeType: 'USAGE' },
            ]
        },
        // 반지하 일반실 - 부부단
        {
            serviceType: 'BONGSAN', subType: '반지하 일반실', groupType: '부부단', unit: '원', rows: [
                { name: '8단', price: m(200), feeType: 'USAGE' },
                { name: '7단', price: m(300), feeType: 'USAGE' },
                { name: '6단', price: m(500), feeType: 'USAGE' },
                { name: '5단', price: m(700), feeType: 'USAGE' },
                { name: '4단', price: m(700), feeType: 'USAGE' },
                { name: '3단', price: m(500), feeType: 'USAGE' },
                { name: '2단', price: m(400), feeType: 'USAGE' },
                { name: '1단', price: m(300), feeType: 'USAGE' },
            ]
        },
        // 지상 일반실 - 개인단
        {
            serviceType: 'BONGSAN', subType: '지상 일반실', groupType: '개인단', unit: '원', rows: [
                { name: '8단', price: m(150), feeType: 'USAGE' },
                { name: '7단', price: m(250), feeType: 'USAGE' },
                { name: '6단', price: m(350), feeType: 'USAGE' },
                { name: '5단', price: m(500), feeType: 'USAGE' },
                { name: '4단', price: m(500), feeType: 'USAGE' },
                { name: '3단', price: m(350), feeType: 'USAGE' },
                { name: '2단', price: m(300), feeType: 'USAGE' },
                { name: '1단', price: m(200), feeType: 'USAGE' },
            ]
        },
        // 지상 일반실 - 부부단
        {
            serviceType: 'BONGSAN', subType: '지상 일반실', groupType: '부부단', unit: '원', rows: [
                { name: '8단', price: m(300), feeType: 'USAGE' },
                { name: '7단', price: m(500), feeType: 'USAGE' },
                { name: '6단', price: m(700), feeType: 'USAGE' },
                { name: '5단', price: m(1000), feeType: 'USAGE' },
                { name: '4단', price: m(1000), feeType: 'USAGE' },
                { name: '3단', price: m(700), feeType: 'USAGE' },
                { name: '2단', price: m(600), feeType: 'USAGE' },
                { name: '1단', price: m(400), feeType: 'USAGE' },
            ]
        },
        // 특실 - 부부단
        {
            serviceType: 'BONGSAN', subType: '특실', groupType: '부부단', unit: '원', rows: [
                { name: '8단', price: m(300), feeType: 'USAGE' },
                { name: '7단', price: m(700), feeType: 'USAGE' },
                { name: '6단', price: m(900), feeType: 'USAGE' },
                { name: '5단', price: m(1200), feeType: 'USAGE' },
                { name: '4단', price: m(1200), feeType: 'USAGE' },
                { name: '3단', price: m(1000), feeType: 'USAGE' },
                { name: '2단', price: m(800), feeType: 'USAGE' },
                { name: '1단', price: m(300), feeType: 'USAGE' },
            ]
        },
        // 가족·문중실
        {
            serviceType: 'BONGSAN', subType: '가족·문중실', unit: '원', rows: [
                { name: '8단', price: m(400), feeType: 'USAGE' },
                { name: '7단', price: m(2000), feeType: 'USAGE' },
                { name: '6단', price: m(2000), feeType: 'USAGE' },
                { name: '5단', price: m(1500), feeType: 'USAGE' },
                { name: '4단', price: m(1500), feeType: 'USAGE' },
                { name: '3단', price: m(1200), feeType: 'USAGE' },
                { name: '2단', price: m(1000), feeType: 'USAGE' },
                { name: '1단', price: m(400), feeType: 'USAGE' },
                // 관리비 (봉안당 전체)
                { name: '관리비 (연간)', price: 30000, feeType: 'MAINTENANCE', grade: '1위당, 10년 선납 30만원, 영구 120만원' },
            ]
        },
        // 수목장
        {
            serviceType: 'NATURAL', subType: '수목장', groupType: '가족수목', unit: '원', rows: [
                { name: '사용료 (5~10기)', price: m(500), feeType: 'USAGE', isRepresentative: true, grade: '500~1,200만원' },
            ]
        },
        {
            serviceType: 'NATURAL', subType: '수목장', groupType: '부부수목', unit: '원', rows: [
                { name: '사용료 (2기)', price: m(300), feeType: 'USAGE', grade: '300~1,000만원' },
            ]
        },
        {
            serviceType: 'NATURAL', subType: '수목장', groupType: '개인수목', unit: '원', rows: [
                { name: '사용료 (1기)', price: m(300), feeType: 'USAGE', grade: '300~1,000만원' },
            ]
        },
        {
            serviceType: 'NATURAL', subType: '수목장', groupType: '공동수목', unit: '원', rows: [
                { name: '사용료 (12기)', price: m(100), feeType: 'USAGE', grade: '100~200만원' },
                { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년 3~12만원, 10년 계약' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0655');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
