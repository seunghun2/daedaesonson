/**
 * park-0639 효자추모관 → 아카이브
 * 개인단: 최저 1,000,000 ~ 최고 7,800,000
 * 부부단: 최저 3,000,000 ~ 최고 15,600,000
 * 관리비(1위): 10년 600,000원
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0639');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 개인단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '최저가', price: 1000000, feeType: 'USAGE', isRepresentative: true },
                { name: '최고가', price: 7800000, feeType: 'USAGE' },
                { name: '관리비', price: 600000, feeType: 'MAINTENANCE', grade: '10년, 1위 기준' },
            ]
        },
        // 부부단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '최저가', price: 3000000, feeType: 'USAGE' },
                { name: '최고가', price: 15600000, feeType: 'USAGE' },
                { name: '관리비', price: 600000, feeType: 'MAINTENANCE', grade: '10년, 1위 기준' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0639');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
