/**
 * park-0635 김천추모공원 → 아카이브 (1~9단)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0635');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
            rows: [
                { name: '1단', price: 1500000, feeType: 'USAGE', isRepresentative: true },
                { name: '2단', price: 2000000, feeType: 'USAGE' },
                { name: '3단', price: 2500000, feeType: 'USAGE' },
                { name: '4단', price: 3000000, feeType: 'USAGE' },
                { name: '5단', price: 3500000, feeType: 'USAGE' },
                { name: '6단', price: 3000000, feeType: 'USAGE' },
                { name: '7단', price: 2000000, feeType: 'USAGE' },
                { name: '8단', price: 1500000, feeType: 'USAGE' },
                { name: '9단', price: 1000000, feeType: 'USAGE' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0635');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
