/**
 * park-0642 대한불교정음사원 → 아카이브
 * 1,2층 법당 내부: 2,500,000 / 4,500,000
 * 1,2층 법당 지장보살 불상: 3,500,000
 * 1층 법당 가족단 4위: 6,000,000
 * 관리비 개인단 10년선납: 200,000 / 부부단: 300,000 / 가족단 4위~10위: 500,000
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0642');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
            rows: [
                { name: '1,2층 법당 내부', price: 2500000, feeType: 'USAGE', isRepresentative: true },
                { name: '1,2층 법당 지장보살 불상', price: 3500000, feeType: 'USAGE' },
                { name: '1,2층 법당 내부', price: 4500000, feeType: 'USAGE' },
                { name: '1층 법당 가족단 4위', price: 6000000, feeType: 'USAGE' },
                { name: '관리비 (개인단)', price: 200000, feeType: 'MAINTENANCE', grade: '10년 선납' },
                { name: '관리비 (부부단)', price: 300000, feeType: 'MAINTENANCE', grade: '10년 선납' },
                { name: '관리비 (가족단 4위~10위)', price: 500000, feeType: 'MAINTENANCE', grade: '10년 선납' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0642');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
