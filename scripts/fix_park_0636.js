/**
 * park-0636 (재)용인공원(아너스톤) → 아카이브 + 공홈 URL
 * 일반 봉안당(노블관 8단 센터 기준) / 특별 봉안당(로얄관 5단 상단 기준)
 * 관리비: 일반 개인11만/부부22만, 특별 개인15만/부부30만(1년)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0636');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'https://www.honorstone.co.kr';

    p.priceInfo.standardizedPrices = [
        // 일반 봉안당 (아너관/노블관)
        {
            serviceType: 'BONGSAN', subType: '일반 봉안당', unit: '원',
            rows: [
                { name: '사용료', price: 22000000, feeType: 'USAGE', isRepresentative: true, grade: '노블관 8단 센터 기준' },
                { name: '관리비 (개인)', price: 110000, feeType: 'MAINTENANCE', grade: '1년 단가' },
                { name: '관리비 (부부)', price: 220000, feeType: 'MAINTENANCE', grade: '1년 단가, 2인 기준' },
            ]
        },
        // 특별 봉안당 (로얄관)
        {
            serviceType: 'BONGSAN', subType: '특별 봉안당', unit: '원',
            rows: [
                { name: '사용료', price: 40000000, feeType: 'USAGE', grade: '로얄관 5단 상단 기준' },
                { name: '관리비 (개인)', price: 150000, feeType: 'MAINTENANCE', grade: '1년 단가' },
                { name: '관리비 (부부)', price: 300000, feeType: 'MAINTENANCE', grade: '1년 단가, 2인 기준' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0636');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
