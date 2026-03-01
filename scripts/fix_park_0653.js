/**
 * park-0653 창원공원묘원 봉안시설 → 아카이브 + 공홈URL
 * https://www.changwonpark.kr/
 * 실내봉안당 일반단 1~8단: 250~650만, 관리비 1년 5만원 → 대표 2,550,000
 * 실내봉안당 고급단 1~8단: 500~1300만, 관리비 1년 7만원 → 5,070,000
 * 실내봉안당 특별단 1~7단: 1000~1900만, 관리비 1년 8만원 → 10,080,000
 * 야외봉안당: 1,350,000~2,050,000 (15년관리비 포함)
 * 봉안묘: 9,044,000~ (석물/작업 포함)
 * 평장묘: 3,680,000~
 * 수목형: 3,170,000~
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0653');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'https://www.changwonpark.kr';

    p.priceInfo.standardizedPrices = [
        // 실내봉안당 - 일반단
        {
            serviceType: 'BONGSAN', subType: '실내봉안당', groupType: '일반단', unit: '원',
            rows: [
                { name: '사용료', price: 2550000, feeType: 'USAGE', isRepresentative: true, grade: '1~8단, 250~650만원' },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
            ]
        },
        // 실내봉안당 - 고급단
        {
            serviceType: 'BONGSAN', subType: '실내봉안당', groupType: '고급단', unit: '원',
            rows: [
                { name: '사용료', price: 5070000, feeType: 'USAGE', grade: '1~8단, 500~1300만원' },
                { name: '관리비', price: 70000, feeType: 'MAINTENANCE', grade: '1년' },
            ]
        },
        // 실내봉안당 - 특별단
        {
            serviceType: 'BONGSAN', subType: '실내봉안당', groupType: '특별단', unit: '원',
            rows: [
                { name: '사용료', price: 10080000, feeType: 'USAGE', grade: '1~7단, 1000~1900만원' },
                { name: '관리비', price: 80000, feeType: 'MAINTENANCE', grade: '1년' },
            ]
        },
        // 야외봉안당
        {
            serviceType: 'BONGSAN', subType: '야외봉안당', unit: '원',
            rows: [
                { name: '사용료', price: 1350000, feeType: 'USAGE', grade: '15년 관리비 포함, 1,350,000~2,050,000원' },
            ]
        },
        // 봉안묘 → BURIAL (야외)
        {
            serviceType: 'BURIAL', subType: '봉안묘', unit: '원',
            rows: [
                { name: '사용료', price: 9044000, feeType: 'USAGE', grade: '관리비11년/석물/작업비 포함, ~44,610,000원' },
            ]
        },
        // 평장묘 → BURIAL
        {
            serviceType: 'BURIAL', subType: '평장묘', unit: '원',
            rows: [
                { name: '사용료', price: 3680000, feeType: 'USAGE', grade: '관리비11년/석물/작업비 포함, ~29,206,800원' },
            ]
        },
        // 수목형 → NATURAL
        {
            serviceType: 'NATURAL', subType: '수목장', unit: '원',
            rows: [
                { name: '사용료', price: 3170000, feeType: 'USAGE', grade: '관리비11년/석물/작업비 포함, ~23,842,000원' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0653');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
