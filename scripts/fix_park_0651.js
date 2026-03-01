/**
 * park-0651 감로복지원 진주추모공원 → 아카이브
 * 특별관 특별단 1~6단 (60년 관리비, 보전금250,000원 포함)
 * 개인단: 1단 1,990,000 / 2단 3,500,000 / 3단 4,500,000 / 4단 5,800,000 / 5단 6,400,000 / 6단 5,400,000
 * 부부단 추가: 1단 +170만 / 2단 +200만 / 3단 +250만 / 4단 +350만 / 5단 +400만 / 6단 +330만
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0651');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 개인단
        {
            serviceType: 'BONGSAN', subType: '특별관', groupType: '개인단', unit: '원',
            rows: [
                { name: '6단', price: 5400000, feeType: 'USAGE', grade: '60년 사용, 관리비·보전금 포함' },
                { name: '5단', price: 6400000, feeType: 'USAGE' },
                { name: '4단', price: 5800000, feeType: 'USAGE', isRepresentative: true },
                { name: '3단', price: 4500000, feeType: 'USAGE' },
                { name: '2단', price: 3500000, feeType: 'USAGE' },
                { name: '1단', price: 1990000, feeType: 'USAGE' },
            ]
        },
        // 부부단 (개인단 + 추가금)
        {
            serviceType: 'BONGSAN', subType: '특별관', groupType: '부부단', unit: '원',
            rows: [
                { name: '6단', price: 8700000, feeType: 'USAGE', grade: '60년 사용, 관리비·보전금 포함' },
                { name: '5단', price: 10400000, feeType: 'USAGE' },
                { name: '4단', price: 9300000, feeType: 'USAGE' },
                { name: '3단', price: 7000000, feeType: 'USAGE' },
                { name: '2단', price: 5500000, feeType: 'USAGE' },
                { name: '1단', price: 3690000, feeType: 'USAGE' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0651');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
