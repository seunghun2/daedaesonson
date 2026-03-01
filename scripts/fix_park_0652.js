/**
 * park-0652 통일로추모공원 → 공홈 이미지 (1순위)
 * http://tongilro-park.co.kr/
 *
 * [VIP실] (만원)
 * 개인단: 9단300/8단400/7단550/5단700/4단600/3단500/2단350
 * 부부단: 9단600/8단800/7단1100/5단1400/4단1200/3단1000/2단700
 * 정면 개인단: 5단750/4단650/3단550/2단400
 * 정면 부부단: 8단900/7단1200/5단1500/4단1300/3단1100/2단800
 *
 * [일반실] (만원)
 * 1호(29~49실) 개인단: 10단100/9단150/8단250/7단350/5단500/4단400/3단300/2단200
 * 2호(1~28실,1층50~78실) 개인단: 10단150/9단200/8단300/7단400/5단450/4단450/3단350/2단250
 * 부부단: 10단400/9단500/8단600/7단900/5단1100/4단900/3단700/2단500
 *
 * 관리비: 개인단 5년 35만원 / 부부단 5년 70만원 (5년 단위 선납)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0652');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'http://tongilro-park.co.kr';

    p.priceInfo.standardizedPrices = [
        // VIP실 - 개인단
        {
            serviceType: 'BONGSAN', subType: 'VIP실', groupType: '개인단', unit: '원',
            rows: [
                { name: '9단', price: 3000000, feeType: 'USAGE' },
                { name: '8단', price: 4000000, feeType: 'USAGE' },
                { name: '7단', price: 5500000, feeType: 'USAGE' },
                { name: '5단', price: 7000000, feeType: 'USAGE' },
                { name: '4단', price: 6000000, feeType: 'USAGE' },
                { name: '3단', price: 5000000, feeType: 'USAGE' },
                { name: '2단', price: 3500000, feeType: 'USAGE' },
            ]
        },
        // VIP실 - 부부단
        {
            serviceType: 'BONGSAN', subType: 'VIP실', groupType: '부부단', unit: '원',
            rows: [
                { name: '9단', price: 6000000, feeType: 'USAGE' },
                { name: '8단', price: 8000000, feeType: 'USAGE' },
                { name: '7단', price: 11000000, feeType: 'USAGE' },
                { name: '5단', price: 14000000, feeType: 'USAGE' },
                { name: '4단', price: 12000000, feeType: 'USAGE' },
                { name: '3단', price: 10000000, feeType: 'USAGE' },
                { name: '2단', price: 7000000, feeType: 'USAGE' },
            ]
        },
        // VIP실 - 정면 개인단
        {
            serviceType: 'BONGSAN', subType: 'VIP실', groupType: '정면 개인단', unit: '원',
            rows: [
                { name: '5단', price: 7500000, feeType: 'USAGE' },
                { name: '4단', price: 6500000, feeType: 'USAGE' },
                { name: '3단', price: 5500000, feeType: 'USAGE' },
                { name: '2단', price: 4000000, feeType: 'USAGE' },
            ]
        },
        // VIP실 - 정면 부부단
        {
            serviceType: 'BONGSAN', subType: 'VIP실', groupType: '정면 부부단', unit: '원',
            rows: [
                { name: '8단', price: 9000000, feeType: 'USAGE' },
                { name: '7단', price: 12000000, feeType: 'USAGE' },
                { name: '5단', price: 15000000, feeType: 'USAGE' },
                { name: '4단', price: 13000000, feeType: 'USAGE' },
                { name: '3단', price: 11000000, feeType: 'USAGE' },
                { name: '2단', price: 8000000, feeType: 'USAGE' },
            ]
        },
        // 일반실 - 1호 개인단
        {
            serviceType: 'BONGSAN', subType: '일반실', groupType: '1호 개인단', unit: '원',
            rows: [
                { name: '10단', price: 1000000, feeType: 'USAGE', isRepresentative: true },
                { name: '9단', price: 1500000, feeType: 'USAGE' },
                { name: '8단', price: 2500000, feeType: 'USAGE' },
                { name: '7단', price: 3500000, feeType: 'USAGE' },
                { name: '5단', price: 5000000, feeType: 'USAGE' },
                { name: '4단', price: 4000000, feeType: 'USAGE' },
                { name: '3단', price: 3000000, feeType: 'USAGE' },
                { name: '2단', price: 2000000, feeType: 'USAGE' },
            ]
        },
        // 일반실 - 2호 개인단
        {
            serviceType: 'BONGSAN', subType: '일반실', groupType: '2호 개인단', unit: '원',
            rows: [
                { name: '10단', price: 1500000, feeType: 'USAGE', grade: '2호 1~28실, 1층 50~78실' },
                { name: '9단', price: 2000000, feeType: 'USAGE' },
                { name: '8단', price: 3000000, feeType: 'USAGE' },
                { name: '7단', price: 4000000, feeType: 'USAGE' },
                { name: '5단', price: 4500000, feeType: 'USAGE' },
                { name: '4단', price: 4500000, feeType: 'USAGE' },
                { name: '3단', price: 3500000, feeType: 'USAGE' },
                { name: '2단', price: 2500000, feeType: 'USAGE' },
            ]
        },
        // 일반실 - 부부단
        {
            serviceType: 'BONGSAN', subType: '일반실', groupType: '부부단', unit: '원',
            rows: [
                { name: '10단', price: 4000000, feeType: 'USAGE' },
                { name: '9단', price: 5000000, feeType: 'USAGE' },
                { name: '8단', price: 6000000, feeType: 'USAGE' },
                { name: '7단', price: 9000000, feeType: 'USAGE' },
                { name: '5단', price: 11000000, feeType: 'USAGE' },
                { name: '4단', price: 9000000, feeType: 'USAGE' },
                { name: '3단', price: 7000000, feeType: 'USAGE' },
                { name: '2단', price: 5000000, feeType: 'USAGE' },
                { name: '관리비 (개인단)', price: 350000, feeType: 'MAINTENANCE', grade: '5년 선납, 1위 기준' },
                { name: '관리비 (부부단)', price: 700000, feeType: 'MAINTENANCE', grade: '5년 선납, 1위 기준' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0652');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
