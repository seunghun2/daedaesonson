/**
 * park-0585 보현정사 — grade 정리, serviceType 확인
 * 이미 구조는 깔끔. grade에 groupType과 중복된 "일반"/"특별" 제거
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const p = data.find(x => x.id === 'park-0585');
    if (!p) { console.log('NOT FOUND'); return; }
    if (!p.priceInfo) p.priceInfo = {};

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
            rows: [
                // 일반
                { name: '1단', price: 2000000, feeType: 'USAGE', isRepresentative: true, groupType: '일반' },
                { name: '2단', price: 2500000, feeType: 'USAGE', groupType: '일반' },
                { name: '3단', price: 2500000, feeType: 'USAGE', groupType: '일반' },
                { name: '4단', price: 3000000, feeType: 'USAGE', groupType: '일반' },
                { name: '5단', price: 3000000, feeType: 'USAGE', groupType: '일반' },
                { name: '6단', price: 3000000, feeType: 'USAGE', groupType: '일반' },
                { name: '7단', price: 2500000, feeType: 'USAGE', groupType: '일반' },
                { name: '8단', price: 2500000, feeType: 'USAGE', groupType: '일반' },
                { name: '9단', price: 1500000, feeType: 'USAGE', groupType: '일반' },
                // 특별
                { name: '1단', price: 3000000, feeType: 'USAGE', isRepresentative: true, groupType: '특별' },
                { name: '2단', price: 3500000, feeType: 'USAGE', groupType: '특별' },
                { name: '3단', price: 3500000, feeType: 'USAGE', groupType: '특별' },
                { name: '4단', price: 4000000, feeType: 'USAGE', groupType: '특별' },
                { name: '5단', price: 4000000, feeType: 'USAGE', groupType: '특별' },
                { name: '6단', price: 4000000, feeType: 'USAGE', groupType: '특별' },
                { name: '7단', price: 3500000, feeType: 'USAGE', groupType: '특별' },
                { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '특별' },
                { name: '9단', price: 2500000, feeType: 'USAGE', groupType: '특별' },
            ]
        }
    ];

    p.priceInfo.priceVerified = true;
    p.minPrice = 1500000;
    p.maxPrice = 4000000;
    p.representativePrice = 1500000;
    p.priceRange = { min: 1500000, max: 4000000 };
    p.hasDetailedPrices = true;

    console.log('✅ park-0585 보현정사 → grade 정리, 가격범위 수정');

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
        .eq('id', 'park-0585');
    console.log(error ? '❌ ' + error.message : '✅ DB 동기화 완료');
}
fix().catch(console.error);
