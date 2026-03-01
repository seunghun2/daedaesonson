/**
 * park-0654 생극납골공원 → 아카이브
 * 개인단(1,2,7단) 15년: 750,000
 * 개인단(1,2,3,4,5,6,7단) 영구: 2,000,000
 * 부부단(1,2,7단) 15년: 1,500,000
 * 부부단(1,2,3,4,5,6,7단) 영구: 4,000,000
 * 가족단(4위) 영구: 16,000,000
 * 가족단(6위) 영구: 24,000,000
 * 가족단(8위) 영구: 29,000,000
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0654');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 개인단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '사용료 (15년)', price: 750000, feeType: 'USAGE', isRepresentative: true, grade: '1,2,7단' },
                { name: '사용료 (영구)', price: 2000000, feeType: 'USAGE', grade: '1~7단' },
            ]
        },
        // 부부단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '사용료 (15년)', price: 1500000, feeType: 'USAGE', grade: '1,2,7단' },
                { name: '사용료 (영구)', price: 4000000, feeType: 'USAGE', grade: '1~7단' },
            ]
        },
        // 가족단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '가족단', unit: '원',
            rows: [
                { name: '4위', price: 16000000, feeType: 'USAGE', grade: '영구' },
                { name: '6위', price: 24000000, feeType: 'USAGE', grade: '영구' },
                { name: '8위', price: 29000000, feeType: 'USAGE', grade: '영구' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0654');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
