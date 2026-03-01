/**
 * park-0644 충주시 천상원 → 공홈 (1순위)
 * https://www.cjfmc.or.kr/www/contents.do?key=94
 * 개인단(1기당): 관내 300,000 / 관외 900,000
 * 부부단(1기당): 관내 500,000 / 관외 1,500,000
 * 무연고: 관내 70,000 / 관외 210,000
 * 사용기간: 15년 (단 무연고 5년)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0644');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'https://www.cjfmc.or.kr/www/contents.do?key=94';

    p.priceInfo.standardizedPrices = [
        // 개인단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '사용료', price: 300000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true, grade: '사용기간 15년' },
                { name: '사용료', price: 900000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용기간 15년' },
            ]
        },
        // 부부단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '사용료', price: 500000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용기간 15년' },
                { name: '사용료', price: 1500000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용기간 15년' },
            ]
        },
        // 무연고
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '무연고', unit: '원',
            rows: [
                { name: '사용료', price: 70000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용기간 5년' },
                { name: '사용료', price: 210000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용기간 5년' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0644');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
