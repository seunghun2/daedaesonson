/**
 * park-0638 용화사 봉안당 → 아카이브
 * 30cm×29cm → 개인단 / 50cm×29cm → 부부단
 * 복합단 쪼개기: 2,3단 → 2단+3단, 4,5,6,7단 → 4단+5단+6단+7단
 * 관리비(1년): 70,000원
 * 임시봉안: 개인 500,000 / 부부 980,000 (1년 기준)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0638');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 개인단 (30cm×29cm)
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '1단', price: 2000000, feeType: 'USAGE', isRepresentative: true, grade: '30cm×29cm' },
                { name: '2단', price: 3000000, feeType: 'USAGE' },
                { name: '3단', price: 3000000, feeType: 'USAGE' },
                { name: '4단', price: 5000000, feeType: 'USAGE' },
                { name: '5단', price: 5000000, feeType: 'USAGE' },
                { name: '6단', price: 5000000, feeType: 'USAGE' },
                { name: '7단', price: 5000000, feeType: 'USAGE' },
                { name: '관리비', price: 70000, feeType: 'MAINTENANCE', grade: '1년' },
                { name: '임시봉안', price: 500000, feeType: 'USAGE', grade: '1년 기준' },
            ]
        },
        // 부부단 (50cm×29cm)
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '1단', price: 3800000, feeType: 'USAGE', grade: '50cm×29cm' },
                { name: '2단', price: 5800000, feeType: 'USAGE' },
                { name: '3단', price: 5800000, feeType: 'USAGE' },
                { name: '4단', price: 9800000, feeType: 'USAGE' },
                { name: '5단', price: 9800000, feeType: 'USAGE' },
                { name: '6단', price: 9800000, feeType: 'USAGE' },
                { name: '7단', price: 9800000, feeType: 'USAGE' },
                { name: '관리비', price: 70000, feeType: 'MAINTENANCE', grade: '1년' },
                { name: '임시봉안', price: 980000, feeType: 'USAGE', grade: '1년 기준' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0638');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
