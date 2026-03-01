/**
 * park-0643 대원사추모공원 봉안당 → 아카이브
 * 봉안비용: 8단=500,000 / 7단=600,000 / 6단=800,000 / 5단,4단=1,000,000 / 3단=800,000 / 2단=700,000 / 1단=600,000
 * 개인단 × 2 = 1,000,000 (부부단)
 * 복합단 쪼개기: 5단,4단 → 5단 + 4단
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0643');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
            rows: [
                { name: '8단', price: 500000, feeType: 'USAGE' },
                { name: '7단', price: 600000, feeType: 'USAGE' },
                { name: '6단', price: 800000, feeType: 'USAGE' },
                { name: '5단', price: 1000000, feeType: 'USAGE' },
                { name: '4단', price: 1000000, feeType: 'USAGE' },
                { name: '3단', price: 800000, feeType: 'USAGE' },
                { name: '2단', price: 700000, feeType: 'USAGE' },
                { name: '1단', price: 600000, feeType: 'USAGE', isRepresentative: true },
                { name: '부부단 (개인단 × 2)', price: 1000000, feeType: 'USAGE', grade: '개인단 가격 × 2' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0643');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
