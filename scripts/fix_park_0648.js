/**
 * park-0648 예수사랑제일교회 → 아카이브
 * 30cm = 개인단: 1단9단=3,800,000 / 2단8단=4,500,000 / 3단7단=5,000,000 / 4단5단6단=6,000,000
 * 60cm = 부부단: 1단9단=6,840,000 / 2단8단=8,100,000 / 3단7단=9,000,000 / 4단5단6단=10,800,000
 * 복합단 쪼개기 필요
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0648');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 개인단 (30cm)
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '1단', price: 3800000, feeType: 'USAGE', grade: '30cm' },
                { name: '2단', price: 4500000, feeType: 'USAGE' },
                { name: '3단', price: 5000000, feeType: 'USAGE', isRepresentative: true },
                { name: '4단', price: 6000000, feeType: 'USAGE' },
                { name: '5단', price: 6000000, feeType: 'USAGE' },
                { name: '6단', price: 6000000, feeType: 'USAGE' },
                { name: '7단', price: 5000000, feeType: 'USAGE' },
                { name: '8단', price: 4500000, feeType: 'USAGE' },
                { name: '9단', price: 3800000, feeType: 'USAGE' },
            ]
        },
        // 부부단 (60cm)
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '1단', price: 6840000, feeType: 'USAGE', grade: '60cm' },
                { name: '2단', price: 8100000, feeType: 'USAGE' },
                { name: '3단', price: 9000000, feeType: 'USAGE' },
                { name: '4단', price: 10800000, feeType: 'USAGE' },
                { name: '5단', price: 10800000, feeType: 'USAGE' },
                { name: '6단', price: 10800000, feeType: 'USAGE' },
                { name: '7단', price: 9000000, feeType: 'USAGE' },
                { name: '8단', price: 8100000, feeType: 'USAGE' },
                { name: '9단', price: 6840000, feeType: 'USAGE' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0648');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
