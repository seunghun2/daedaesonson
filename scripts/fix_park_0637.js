/**
 * park-0637 아름다운추모원 → 공홈 이미지 (1순위)
 * 영구안치 신관(2관): 개인단 / 특별단(부부단) 8~1단
 * 영구안치 구관(1관): 200~400만 개인단
 * 관리비(1인기준): 5년 250,000원 / 10년 450,000원
 * 공홈: http://earumdaun.jhost.co.kr/
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0637');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'http://earumdaun.jhost.co.kr';

    p.priceInfo.standardizedPrices = [
        // 신관(2관) - 개인단
        {
            serviceType: 'BONGSAN', subType: '신관 (2관)', groupType: '개인단', unit: '원',
            rows: [
                { name: '8단', price: 2500000, feeType: 'USAGE', isRepresentative: true, grade: '영구안치' },
                { name: '7단', price: 3300000, feeType: 'USAGE' },
                { name: '6단', price: 4000000, feeType: 'USAGE' },
                { name: '5단', price: 5000000, feeType: 'USAGE' },
                { name: '4단', price: 5000000, feeType: 'USAGE' },
                { name: '3단', price: 4000000, feeType: 'USAGE' },
                { name: '2단', price: 3500000, feeType: 'USAGE' },
                { name: '1단', price: 2800000, feeType: 'USAGE' },
                { name: '관리비', price: 250000, feeType: 'MAINTENANCE', grade: '5년, 1인 기준 (10년 450,000원)' },
            ]
        },
        // 신관(2관) - 특별단(부부단)
        {
            serviceType: 'BONGSAN', subType: '신관 (2관)', groupType: '특별단 (부부단)', unit: '원',
            rows: [
                { name: '8단', price: 5000000, feeType: 'USAGE', grade: '영구안치' },
                { name: '7단', price: 6600000, feeType: 'USAGE' },
                { name: '6단', price: 8000000, feeType: 'USAGE' },
                { name: '5단', price: 10000000, feeType: 'USAGE' },
                { name: '4단', price: 10000000, feeType: 'USAGE' },
                { name: '3단', price: 8000000, feeType: 'USAGE' },
                { name: '2단', price: 7000000, feeType: 'USAGE' },
                { name: '1단', price: 5600000, feeType: 'USAGE' },
                { name: '관리비', price: 250000, feeType: 'MAINTENANCE', grade: '5년, 1인 기준 (10년 450,000원)' },
            ]
        },
        // 구관(1관) - 개인단
        {
            serviceType: 'BONGSAN', subType: '구관 (1관)', unit: '원',
            rows: [
                { name: '사용료', price: 2000000, feeType: 'USAGE', grade: '영구안치, 200~400만원' },
                { name: '관리비', price: 250000, feeType: 'MAINTENANCE', grade: '5년, 1인 기준 (10년 450,000원)' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0637');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
