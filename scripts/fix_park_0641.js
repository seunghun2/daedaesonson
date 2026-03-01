/**
 * park-0641 오향중흥교회 봉안당 → 아카이브
 * 4개 관: 믿음관/사랑관/소망관/안식관
 * 각 관별: 개인 4,375,000 + 부부 8,750,000 (소망/안식은 개인 4,710,000 + 부부 9,420,000)
 * 관리비: 50,000/년 (관내)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0641');
    if (!p) { console.log('NOT FOUND'); return; }

    // 아카이브 데이터 분석:
    // 믿음관: 개인 4,375,000 / 부부 8,750,000
    // 사랑관: 개인 4,375,000 / 부부 8,750,000
    // 소망관: 개인 4,710,000 / 부부 9,420,000
    // 안식관: 개인 4,710,000 / 부부 9,420,000
    // 관리비(관내): 1년 50,000

    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '믿음관', unit: '원',
            rows: [
                { name: '개인', price: 4375000, feeType: 'USAGE', isRepresentative: true },
                { name: '부부', price: 8750000, feeType: 'USAGE' },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '사랑관', unit: '원',
            rows: [
                { name: '개인', price: 4375000, feeType: 'USAGE' },
                { name: '부부', price: 8750000, feeType: 'USAGE' },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '소망관', unit: '원',
            rows: [
                { name: '개인', price: 4710000, feeType: 'USAGE' },
                { name: '부부', price: 9420000, feeType: 'USAGE' },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '안식관', unit: '원',
            rows: [
                { name: '개인', price: 4710000, feeType: 'USAGE' },
                { name: '부부', price: 9420000, feeType: 'USAGE' },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0641');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
