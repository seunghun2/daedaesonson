/**
 * park-0582 (재)밀양추모공원묘원 — archive5 이미지 기준 정제
 * serviceType: OTHER → BONGSAN, 관리비 정보 없음
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const p = data.find(x => x.id === 'park-0582');
    if (!p) { console.log('NOT FOUND'); return; }
    if (!p.priceInfo) p.priceInfo = {};

    // priceTable은 이미 깔끔 — 유지
    // standardizedPrices만 serviceType 수정 + 정리
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
            rows: [
                { name: '안치단 1등급', price: 3500000, feeType: 'USAGE', grade: '1기' },
                { name: '안치단 2등급', price: 2500000, feeType: 'USAGE', grade: '1기' },
                { name: '안치단 3등급', price: 2000000, feeType: 'USAGE', grade: '1기' },
                { name: '안치단 4등급', price: 1000000, feeType: 'USAGE', grade: '1기', isRepresentative: true },
                { name: '평장 (부부)', price: 7000000, feeType: 'USAGE', grade: '2기' },
            ]
        }
    ];

    p.priceInfo.priceVerified = true;
    p.minPrice = 1000000;
    p.maxPrice = 7000000;
    p.representativePrice = 1000000;
    p.priceRange = { min: 1000000, max: 7000000 };
    p.hasDetailedPrices = true;

    console.log('✅ park-0582 정제 완료');

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
        .eq('id', 'park-0582');
    console.log(error ? '❌ ' + error.message : '✅ DB 동기화 완료');
}
fix().catch(console.error);
