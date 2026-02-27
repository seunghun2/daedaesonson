/**
 * park-0583 다보정사 안미원 — 봉안당 1개 아코디언 + groupType 분리
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const p = data.find(x => x.id === 'park-0583');
    if (!p) { console.log('NOT FOUND'); return; }
    if (!p.priceInfo) p.priceInfo = {};

    p.priceInfo.priceTable = {
        '봉안당': {
            category: 'charnel', unit: '원',
            rows: [
                { name: '2단', price: 600000, isRepresentative: true, grade: '영구', groupType: '개인' },
                { name: '3단', price: 1200000, grade: '영구', groupType: '개인' },
                { name: '4단', price: 1800000, grade: '영구', groupType: '개인' },
                { name: '5단', price: 2500000, grade: '영구', groupType: '개인' },
                { name: '6단', price: 2500000, grade: '영구', groupType: '개인' },
                { name: '7단', price: 1800000, grade: '영구', groupType: '개인' },
                { name: '8단', price: 1200000, grade: '영구', groupType: '개인' },
                { name: '2단 (2기)', price: 2200000, isRepresentative: true, grade: '영구', groupType: '부부' },
                { name: '3단 (2기)', price: 3000000, grade: '영구', groupType: '부부' },
                { name: '4단 (2기)', price: 4000000, grade: '영구', groupType: '부부' },
                { name: '5단 (2기)', price: 5000000, grade: '영구', groupType: '부부' },
                { name: '6단 (2기)', price: 5000000, grade: '영구', groupType: '부부' },
                { name: '7단 (2기)', price: 4000000, grade: '영구', groupType: '부부' },
                { name: '8단 (2기)', price: 3000000, grade: '영구', groupType: '부부' },
                { name: '2단', price: 1600000, isRepresentative: true, grade: '영구', groupType: '특실' },
                { name: '3단', price: 2200000, grade: '영구', groupType: '특실' },
                { name: '4단', price: 2800000, grade: '영구', groupType: '특실' },
                { name: '5단', price: 3500000, grade: '영구', groupType: '특실' },
                { name: '6단', price: 3500000, grade: '영구', groupType: '특실' },
                { name: '7단', price: 2800000, grade: '영구', groupType: '특실' },
                { name: '8단', price: 2200000, grade: '영구', groupType: '특실' },
            ]
        },
        '야외봉안탑': {
            category: 'charnel', unit: '원',
            rows: [
                { name: '부부탑 (2구)', price: 15000000, isRepresentative: true, grade: '영구' },
                { name: '가족탑 (10구)', price: 20000000, grade: '영구' },
            ]
        }
    };

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
            rows: [
                // 개인
                { name: '2단', price: 600000, feeType: 'USAGE', grade: '영구', isRepresentative: true, groupType: '개인' },
                { name: '3단', price: 1200000, feeType: 'USAGE', grade: '영구', groupType: '개인' },
                { name: '4단', price: 1800000, feeType: 'USAGE', grade: '영구', groupType: '개인' },
                { name: '5단', price: 2500000, feeType: 'USAGE', grade: '영구', groupType: '개인' },
                { name: '6단', price: 2500000, feeType: 'USAGE', grade: '영구', groupType: '개인' },
                { name: '7단', price: 1800000, feeType: 'USAGE', grade: '영구', groupType: '개인' },
                { name: '8단', price: 1200000, feeType: 'USAGE', grade: '영구', groupType: '개인' },
                { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '10년', groupType: '개인' },
                // 부부
                { name: '2단 (2기)', price: 2200000, feeType: 'USAGE', grade: '영구', isRepresentative: true, groupType: '부부' },
                { name: '3단 (2기)', price: 3000000, feeType: 'USAGE', grade: '영구', groupType: '부부' },
                { name: '4단 (2기)', price: 4000000, feeType: 'USAGE', grade: '영구', groupType: '부부' },
                { name: '5단 (2기)', price: 5000000, feeType: 'USAGE', grade: '영구', groupType: '부부' },
                { name: '6단 (2기)', price: 5000000, feeType: 'USAGE', grade: '영구', groupType: '부부' },
                { name: '7단 (2기)', price: 4000000, feeType: 'USAGE', grade: '영구', groupType: '부부' },
                { name: '8단 (2기)', price: 3000000, feeType: 'USAGE', grade: '영구', groupType: '부부' },
                { name: '관리비', price: 450000, feeType: 'MAINTENANCE', grade: '10년', groupType: '부부' },
                { name: '2회차 안치비', price: 200000, feeType: 'USAGE', grade: '추가 안치 시', groupType: '부부' },
                // 특실
                { name: '2단', price: 1600000, feeType: 'USAGE', grade: '영구', isRepresentative: true, groupType: '특실' },
                { name: '3단', price: 2200000, feeType: 'USAGE', grade: '영구', groupType: '특실' },
                { name: '4단', price: 2800000, feeType: 'USAGE', grade: '영구', groupType: '특실' },
                { name: '5단', price: 3500000, feeType: 'USAGE', grade: '영구', groupType: '특실' },
                { name: '6단', price: 3500000, feeType: 'USAGE', grade: '영구', groupType: '특실' },
                { name: '7단', price: 2800000, feeType: 'USAGE', grade: '영구', groupType: '특실' },
                { name: '8단', price: 2200000, feeType: 'USAGE', grade: '영구', groupType: '특실' },
                { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '10년', groupType: '특실' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '야외봉안탑', unit: '원',
            rows: [
                { name: '부부탑 (2구)', price: 15000000, feeType: 'USAGE', grade: '영구', isRepresentative: true },
                { name: '가족탑 (10구)', price: 20000000, feeType: 'USAGE', grade: '영구' },
                { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '10년' },
                { name: '2회차 안치비', price: 300000, feeType: 'USAGE', grade: '추가 안치 시' },
            ]
        },
    ];

    p.priceInfo.priceVerified = true;
    p.minPrice = 600000;
    p.maxPrice = 20000000;
    p.representativePrice = 600000;
    p.priceRange = { min: 600000, max: 20000000 };
    p.hasDetailedPrices = true;

    console.log('✅ park-0583 → 봉안당(개인/부부/특실 groupType) + 야외봉안탑');

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
        .eq('id', 'park-0583');
    console.log(error ? '❌ ' + error.message : '✅ DB 동기화 완료');
}
fix().catch(console.error);
