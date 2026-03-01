/**
 * park-0647 → 공홈 (1순위)
 * https://www.huic.co.kr/www/contents.do?key=106
 * 개인단: 최초 15년 관내 500,000 / 관외 1,000,000
 *         연장 15년 관내 400,000 / 관외 800,000
 * 부부단: 최초 15년 관내 700,000 / 관외 1,400,000
 *         연장 15년 관내 600,000 / 관외 1,200,000
 * 무연고 유골 안치기간 5년
 * 연장: 개인단 관내 400,000 / 관외 800,000
 *       부부단 관내 600,000 / 관외 1,200,000 (부부 관내외 900,000)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0647');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'https://www.huic.co.kr/www/contents.do?key=106';

    p.priceInfo.standardizedPrices = [
        // 개인단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '최초사용료 (15년)', price: 500000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true },
                { name: '최초사용료 (15년)', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                { name: '연장사용료 (15년)', price: 400000, feeType: 'USAGE', residency: 'LOCAL' },
                { name: '연장사용료 (15년)', price: 800000, feeType: 'USAGE', residency: 'NON_LOCAL' },
            ]
        },
        // 부부단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '최초사용료 (15년)', price: 700000, feeType: 'USAGE', residency: 'LOCAL' },
                { name: '최초사용료 (15년)', price: 1400000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                { name: '연장사용료 (15년)', price: 600000, feeType: 'USAGE', residency: 'LOCAL' },
                { name: '연장사용료 (15년)', price: 1200000, feeType: 'USAGE', residency: 'NON_LOCAL' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0647');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
