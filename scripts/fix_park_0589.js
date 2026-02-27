/**
 * park-0589 (재)서호추모공원 — 공식 홈페이지(seohopark.kr) 기준 업데이트
 * 
 * 봉안당: 골드실 / 특별실(수선화실) / 특별실(백련화실) / 특별실(물망초실) / 무지개실
 * + 수목장 / 잔디장
 * 
 * 단위: 만원 → 원으로 변환
 * 관리비: 5년 선납 기준
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const W = 10000; // 만원

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const p = data.find(x => x.id === 'park-0589');
    if (!p) { console.log('NOT FOUND'); return; }
    if (!p.priceInfo) p.priceInfo = {};

    p.priceInfo.standardizedPrices = [
        // ========== 골드실 ==========
        {
            serviceType: 'BONGSAN', subType: '골드실', unit: '원',
            rows: [
                // 개인
                { name: '1단', price: 100 * W, feeType: 'USAGE', isRepresentative: true, groupType: '개인', grade: '영구안치' },
                { name: '2단', price: 270 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '3단', price: 400 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '4단', price: 550 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '5단', price: 700 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '6단', price: 600 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '7단', price: 350 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '8단', price: 100 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                // 부부
                { name: '1단', price: 200 * W, feeType: 'USAGE', isRepresentative: true, groupType: '부부', grade: '영구안치' },
                { name: '2단', price: 540 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '3단', price: 800 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '4단', price: 1100 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '5단', price: 1400 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '6단', price: 1200 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '7단', price: 700 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '8단', price: 200 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                // 관리비
                { name: '관리비 (개인)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 6만원' },
                { name: '관리비 (부부)', price: 60 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 6만원' },
            ]
        },
        // ========== 특별실(수선화실) ==========
        {
            serviceType: 'BONGSAN', subType: '특별실(수선화실)', unit: '원',
            rows: [
                { name: '1단', price: 300 * W, feeType: 'USAGE', isRepresentative: true, groupType: '개인', grade: '영구안치' },
                { name: '2단', price: 500 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '3단', price: 700 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '4단', price: 1000 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '5단', price: 1300 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '6단', price: 1000 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '7단', price: 500 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '1단', price: 1000 * W, feeType: 'USAGE', isRepresentative: true, groupType: '부부', grade: '영구안치' },
                { name: '2단', price: 1000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '3단', price: 1400 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '4단', price: 2000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '5단', price: 2600 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '6단', price: 2000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '7단', price: 1000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '관리비 (개인)', price: 40 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 8만원' },
                { name: '관리비 (부부)', price: 80 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 8만원' },
            ]
        },
        // ========== 특별실(백련화실) — 수선화실과 동일 가격 ==========
        {
            serviceType: 'BONGSAN', subType: '특별실(백련화실)', unit: '원',
            rows: [
                { name: '1단', price: 300 * W, feeType: 'USAGE', isRepresentative: true, groupType: '개인', grade: '영구안치' },
                { name: '2단', price: 500 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '3단', price: 700 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '4단', price: 1000 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '5단', price: 1300 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '6단', price: 1000 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '7단', price: 500 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '1단', price: 1000 * W, feeType: 'USAGE', isRepresentative: true, groupType: '부부', grade: '영구안치' },
                { name: '2단', price: 1000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '3단', price: 1400 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '4단', price: 2000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '5단', price: 2600 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '6단', price: 2000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '7단', price: 1000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '관리비 (개인)', price: 40 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 8만원' },
                { name: '관리비 (부부)', price: 80 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 8만원' },
            ]
        },
        // ========== 특별실(물망초실) ==========
        {
            serviceType: 'BONGSAN', subType: '특별실(물망초실)', unit: '원',
            rows: [
                { name: '1단', price: 800 * W, feeType: 'USAGE', isRepresentative: true, groupType: '개인', grade: '영구안치' },
                { name: '2단', price: 1000 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '3단', price: 1200 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '4단', price: 1500 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '5단', price: 1300 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '6단', price: 1000 * W, feeType: 'USAGE', groupType: '개인', grade: '영구안치' },
                { name: '1단', price: 1600 * W, feeType: 'USAGE', isRepresentative: true, groupType: '부부', grade: '영구안치' },
                { name: '2단', price: 2000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '3단', price: 2400 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '4단', price: 3000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '5단', price: 2600 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '6단', price: 2000 * W, feeType: 'USAGE', groupType: '부부', grade: '영구안치' },
                { name: '관리비 (개인)', price: 40 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 8만원' },
                { name: '관리비 (부부)', price: 80 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 8만원' },
            ]
        },
        // ========== 무지개실 (임대형) ==========
        {
            serviceType: 'BONGSAN', subType: '무지개실(일반형)', unit: '원',
            rows: [
                { name: '1단', price: 50 * W, feeType: 'USAGE', isRepresentative: true, groupType: '개인', grade: '15년 임대' },
                { name: '2단', price: 70 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '3단', price: 80 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '4단', price: 100 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '5단', price: 120 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '6단', price: 100 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '7단', price: 70 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '1단', price: 100 * W, feeType: 'USAGE', isRepresentative: true, groupType: '부부', grade: '15년 임대' },
                { name: '2단', price: 140 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '3단', price: 160 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '4단', price: 200 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '5단', price: 240 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '6단', price: 200 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '7단', price: 140 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '관리비 (개인)', price: 15 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 3만원' },
                { name: '관리비 (부부)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 6만원' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '무지개실(창문형)', unit: '원',
            rows: [
                { name: '1단', price: 70 * W, feeType: 'USAGE', isRepresentative: true, groupType: '개인', grade: '15년 임대' },
                { name: '2단', price: 100 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '3단', price: 120 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '4단', price: 150 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '5단', price: 180 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '6단', price: 150 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '7단', price: 100 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '8단', price: 70 * W, feeType: 'USAGE', groupType: '개인', grade: '15년 임대' },
                { name: '1단', price: 140 * W, feeType: 'USAGE', isRepresentative: true, groupType: '부부', grade: '15년 임대' },
                { name: '2단', price: 200 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '3단', price: 240 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '4단', price: 300 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '5단', price: 360 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '6단', price: 300 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '7단', price: 200 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '8단', price: 140 * W, feeType: 'USAGE', groupType: '부부', grade: '15년 임대' },
                { name: '관리비 (개인)', price: 15 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 3만원' },
                { name: '관리비 (부부)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1년 1위 6만원' },
            ]
        },
        // ========== 수목장 ==========
        {
            serviceType: 'NATURAL', subType: '수목장', unit: '원',
            rows: [
                { name: '공동목 (향나무, 1위)', price: 400 * W, feeType: 'USAGE', isRepresentative: true, grade: '영구안치' },
                { name: '부부목 (향나무, 2위)', price: 1000 * W, feeType: 'USAGE', grade: '영구안치' },
                { name: '부부목 (오엽송, 2위)', price: 2600 * W, feeType: 'USAGE', grade: '영구안치' },
                { name: '가족목 (소나무, 4위)', price: 1900 * W, feeType: 'USAGE', grade: '영구안치' },
                { name: '가족목 (오엽송, 4위)', price: 2800 * W, feeType: 'USAGE', grade: '영구안치' },
                { name: '대가족목 (소나무, 8~12위)', price: 3000 * W, feeType: 'USAGE', grade: '영구안치' },
                { name: '대가족목 (오엽송, 8~12위)', price: 4000 * W, feeType: 'USAGE', grade: '영구안치' },
                { name: '관리비 (공동목)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
                { name: '관리비 (부부목)', price: 45 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
                { name: '관리비 (가족목)', price: 55 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
                { name: '관리비 (대가족목)', price: 65 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        // ========== 잔디장 ==========
        {
            serviceType: 'NATURAL', subType: '잔디장', unit: '원',
            rows: [
                { name: '개인장 (1위)', price: 200 * W, feeType: 'USAGE', isRepresentative: true, grade: '영구안치', note: '200~250만원' },
                { name: '부부장 (2위)', price: 400 * W, feeType: 'USAGE', grade: '영구안치', note: '400~500만원' },
                { name: '관리비', price: 20 * W, feeType: 'MAINTENANCE', grade: '5년 선납, 1위 기준' },
            ]
        }
    ];

    p.priceInfo.priceVerified = true;
    p.minPrice = 500000;   // 무지개실 일반형 1단 개인 50만
    p.maxPrice = 40000000; // 대가족목 오엽송 4000만
    p.representativePrice = 1000000; // 골드실 1단
    p.priceRange = { min: 500000, max: 40000000 };
    p.hasDetailedPrices = true;

    console.log('✅ park-0589 (재)서호추모공원 → 홈페이지 기준 전면 업데이트');
    console.log('   봉안당: 골드실/수선화실/백련화실/물망초실/무지개실(일반형+창문형)');
    console.log('   수목장: 공동목/부부목/가족목/대가족목');
    console.log('   잔디장: 개인장/부부장');

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ JSON 저장');

    if (!SUPABASE_KEY) { console.log('⚠️ KEY 없음'); return; }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.from('Facility')
        .update({
            pricing: JSON.stringify(p.priceInfo),
            minPrice: p.minPrice, maxPrice: p.maxPrice,
            representativePrice: p.representativePrice,
        })
        .eq('id', 'park-0589');
    console.log(error ? '❌ ' + error.message : '✅ DB 동기화');
}
fix().catch(console.error);
