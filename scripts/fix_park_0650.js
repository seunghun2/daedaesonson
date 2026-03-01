/**
 * park-0650 화성함백산추모공원(별빛쉼터) → 공홈 (1순위)
 * park-1199 화성함백산추모공원(바람마루) → 공홈 (1순위)
 * https://hbm.hu.or.kr/hambaeksan/www/10/1003/100302.jsp
 *
 * [별빛쉼터 봉안당]
 * 개인단(1구): 관내 500,000 / 관외 1,000,000
 * 부부단(1구): 관내 750,000 / 관외 1,500,000
 * 무연고단(1구): 무료
 *
 * [바람마루 자연장지]
 * 잔디장(1구): 관내 800,000 / 관외 1,600,000
 * 수목장(1구): 관내 1,300,000 / 관외 3,600,000
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    // park-0650 별빛쉼터 (봉안당)
    const p650 = data.find(x => x.id === 'park-0650');
    if (p650) {
        p650.websiteUrl = 'https://hbm.hu.or.kr/hambaeksan/www/10/1003/100302.jsp';
        p650.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
                rows: [
                    { name: '사용료', price: 500000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
                rows: [
                    { name: '사용료', price: 750000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료', price: 1500000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '무연고단', unit: '원',
                rows: [
                    { name: '사용료', price: 0, feeType: 'USAGE', residency: 'LOCAL', grade: '무료' },
                ]
            },
        ];
        console.log('✅', p650.id, p650.name);
    }

    // park-1199 바람마루 (자연장지)
    const p1199 = data.find(x => x.id === 'park-1199');
    if (p1199) {
        p1199.websiteUrl = 'https://hbm.hu.or.kr/hambaeksan/www/10/1003/100302.jsp';
        p1199.priceInfo.standardizedPrices = [
            {
                serviceType: 'NATURAL', subType: '잔디장', unit: '원',
                rows: [
                    { name: '사용료 (1구)', price: 800000, feeType: 'USAGE', residency: 'LOCAL', isRepresentative: true },
                    { name: '사용료 (1구)', price: 1600000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '수목장', unit: '원',
                rows: [
                    { name: '사용료 (1구)', price: 1300000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료 (1구)', price: 3600000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        console.log('✅', p1199.id, p1199.name);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    // Supabase 동기화
    for (const [id, p] of [['park-0650', p650], ['park-1199', p1199]]) {
        if (!p) continue;
        const updateData = { pricing: JSON.stringify(p.priceInfo) };
        if (p.websiteUrl) updateData.websiteUrl = p.websiteUrl;
        const { error } = await supabase.from('Facility').update(updateData).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('☁️', id, 'Supabase 동기화 완료');
    }
}
fix();
