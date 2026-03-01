/**
 * park-0640 쌍용사 봉안당 → 아카이브
 * 지장전내 영구보관: 2M / 3M / 4M / 5M
 * 추모관내 영구보관: 3M / 4M / 5M
 * 15년보관: 700,000
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0640');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 지장전 - 영구보관
        {
            serviceType: 'BONGSAN', subType: '지장전', unit: '원',
            rows: [
                { name: '영구보관 1', price: 2000000, feeType: 'USAGE', isRepresentative: true, grade: '영구보관' },
                { name: '영구보관 2', price: 3000000, feeType: 'USAGE', grade: '영구보관' },
                { name: '영구보관 3', price: 4000000, feeType: 'USAGE', grade: '영구보관' },
                { name: '영구보관 4', price: 5000000, feeType: 'USAGE', grade: '영구보관' },
            ]
        },
        // 추모관 - 영구보관
        {
            serviceType: 'BONGSAN', subType: '추모관', unit: '원',
            rows: [
                { name: '영구보관 1', price: 3000000, feeType: 'USAGE', grade: '영구보관' },
                { name: '영구보관 2', price: 4000000, feeType: 'USAGE', grade: '영구보관' },
                { name: '영구보관 3', price: 5000000, feeType: 'USAGE', grade: '영구보관' },
            ]
        },
        // 15년보관
        {
            serviceType: 'BONGSAN', subType: '15년 보관', unit: '원',
            rows: [
                { name: '사용료', price: 700000, feeType: 'USAGE', grade: '15년' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0640');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
