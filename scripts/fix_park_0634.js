/**
 * park-0634 대한불교염불선종운수사사홍선원 → 아카이브 데이터
 * 단별 가격 + 부부단/특별단 + 관리비(년5만원)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0634');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 개인단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '1단', price: 3000000, feeType: 'USAGE', isRepresentative: true },
                { name: '2단', price: 4000000, feeType: 'USAGE' },
                { name: '3단', price: 5500000, feeType: 'USAGE' },
                { name: '4단', price: 5000000, feeType: 'USAGE' },
                { name: '5단', price: 4500000, feeType: 'USAGE' },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '연 5만원' },
            ]
        },
        // 부부단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '사용료', price: 10000000, feeType: 'USAGE' },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '연 5만원' },
            ]
        },
        // 특별단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '특별단', unit: '원',
            rows: [
                { name: '사용료', price: 7000000, feeType: 'USAGE' },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '연 5만원' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0634');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
