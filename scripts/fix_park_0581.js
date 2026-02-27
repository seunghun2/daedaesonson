/**
 * park-0581 화엄사 — archive5 이미지 기준 정제
 * 복합단 분리 + 개인/부부/별단 아코디언 분리
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const p = data.find(x => x.id === 'park-0581');
    if (!p) { console.log('NOT FOUND'); return; }
    if (!p.priceInfo) p.priceInfo = {};

    p.priceInfo.priceTable = {
        '봉안당(개인)': {
            category: 'charnel', unit: '원',
            rows: [
                { name: '1단', price: 2500000, isRepresentative: true },
                { name: '2단', price: 3000000 },
                { name: '3단', price: 4000000 },
                { name: '4단', price: 4000000 },
                { name: '5단', price: 4000000 },
                { name: '6단', price: 3500000 },
                { name: '7단', price: 2500000 },
                { name: '8단', price: 1500000 },
            ]
        },
        '봉안당(부부)': {
            category: 'charnel', unit: '원',
            rows: [
                { name: '1단', price: 4500000, isRepresentative: true },
                { name: '2단', price: 5500000 },
                { name: '3단', price: 7500000 },
                { name: '4단', price: 7500000 },
                { name: '5단', price: 7500000 },
                { name: '6단', price: 6500000 },
                { name: '7단', price: 4500000 },
                { name: '8단', price: 2500000 },
            ]
        },
        '봉안당(별단)': {
            category: 'charnel', unit: '원',
            rows: [
                { name: '하단', price: 12000000, isRepresentative: true },
                { name: '상단', price: 15000000 },
            ]
        }
    };

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
            rows: [
                { name: '1단', price: 2500000, feeType: 'USAGE', isRepresentative: true },
                { name: '2단', price: 3000000, feeType: 'USAGE' },
                { name: '3단', price: 4000000, feeType: 'USAGE' },
                { name: '4단', price: 4000000, feeType: 'USAGE' },
                { name: '5단', price: 4000000, feeType: 'USAGE' },
                { name: '6단', price: 3500000, feeType: 'USAGE' },
                { name: '7단', price: 2500000, feeType: 'USAGE' },
                { name: '8단', price: 1500000, feeType: 'USAGE' },
                { name: '관리비 (최초 5년)', price: 150000, feeType: 'MAINTENANCE', grade: '5년 선납' },
                { name: '관리비 (5년 이후)', price: 30000, feeType: 'MAINTENANCE', grade: '매년' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
            rows: [
                { name: '1단', price: 4500000, feeType: 'USAGE', isRepresentative: true },
                { name: '2단', price: 5500000, feeType: 'USAGE' },
                { name: '3단', price: 7500000, feeType: 'USAGE' },
                { name: '4단', price: 7500000, feeType: 'USAGE' },
                { name: '5단', price: 7500000, feeType: 'USAGE' },
                { name: '6단', price: 6500000, feeType: 'USAGE' },
                { name: '7단', price: 4500000, feeType: 'USAGE' },
                { name: '8단', price: 2500000, feeType: 'USAGE' },
                { name: '관리비 (최초 5년)', price: 150000, feeType: 'MAINTENANCE', grade: '5년 선납' },
                { name: '관리비 (5년 이후)', price: 30000, feeType: 'MAINTENANCE', grade: '매년' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(별단)', unit: '원',
            rows: [
                { name: '하단', price: 12000000, feeType: 'USAGE', isRepresentative: true },
                { name: '상단', price: 15000000, feeType: 'USAGE' },
                { name: '관리비 (별단 최초 5년)', price: 0, feeType: 'MAINTENANCE', grade: '무료' },
                { name: '위패 1인', price: 50000, feeType: 'MAINTENANCE', grade: '별도', note: '위패 비용(별단만 별도)' },
                { name: '관리비 (5년 이후)', price: 100000, feeType: 'MAINTENANCE', grade: '매년' },
            ]
        },
    ];

    p.priceInfo.priceVerified = true;

    // 가격 범위
    p.minPrice = 1500000;
    p.maxPrice = 15000000;
    p.representativePrice = 2500000;
    p.priceRange = { min: 1500000, max: 15000000 };
    p.hasDetailedPrices = true;

    console.log('✅ park-0581 화엄사 → 개인/부부/별단 아코디언 분리, 복합단 분리 완료');

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ JSON 저장');

    if (!SUPABASE_KEY) { console.log('⚠️ KEY 없음'); return; }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.from('Facility')
        .update({
            pricing: JSON.stringify(p.priceInfo),
            minPrice: p.minPrice,
            maxPrice: p.maxPrice,
            representativePrice: p.representativePrice,
        })
        .eq('id', 'park-0581');
    console.log(error ? '❌ ' + error.message : '✅ DB 동기화 완료');
}
fix().catch(console.error);
