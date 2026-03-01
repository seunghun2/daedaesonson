/**
 * park-0633 월봉사연화원 → grade 텍스트 간소화
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0633');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안담', groupType: '개인단', unit: '원',
            rows: [
                { name: '5단', price: 5500000, feeType: 'USAGE', isRepresentative: true, grade: '총7개동, 380기' },
                { name: '4단', price: 5500000, feeType: 'USAGE' },
                { name: '3단', price: 5000000, feeType: 'USAGE' },
                { name: '2단', price: 4500000, feeType: 'USAGE' },
                { name: '1단', price: 4500000, feeType: 'USAGE' },
                { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년, 선납 5년 150,000원' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안담', groupType: '부부단', unit: '원',
            rows: [
                { name: '5단', price: 11000000, feeType: 'USAGE', grade: '총7개동, 185기' },
                { name: '4단', price: 11000000, feeType: 'USAGE' },
                { name: '3단', price: 10000000, feeType: 'USAGE' },
                { name: '2단', price: 9000000, feeType: 'USAGE' },
                { name: '1단', price: 9000000, feeType: 'USAGE' },
                { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년, 선납 5년 150,000원' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '팔각 봉안담', groupType: '부부단', unit: '원',
            rows: [
                { name: '5단', price: 14000000, feeType: 'USAGE', grade: '총3개동, 120기' },
                { name: '4단', price: 14000000, feeType: 'USAGE' },
                { name: '3단', price: 13000000, feeType: 'USAGE' },
                { name: '2단', price: 12000000, feeType: 'USAGE' },
                { name: '1단', price: 12000000, feeType: 'USAGE' },
                { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년, 선납 5년 150,000원' },
            ]
        },
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ 633 grade 간소화 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0633');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
