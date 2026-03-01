/**
 * park-0669~0672 일괄 처리
 *
 * 669 안동하늘공원 → 아카이브
 *   유연고 개인당 관내 300,000 / 관외 900,000
 *   유연고 부부단 관내 500,000 / 관외 1,500,000
 *   무연고 관내 70,000 / 관외 210,000
 *
 * 670 금산군공설봉안당 → 아카이브
 *   유연 사용료 100,000 / 관리비 50,000
 *   수급자·보훈·유공자 사용료 100,000
 *   무연 사용료 50,000 / 관리비 25,000
 *   유연(관외자) 사용료 200,000
 *
 * 671 재단법인청림공원(봉안당) → 아카이브
 *   개인단 250~600만 → 2,700,000 / 관리비 5만/년
 *   부부단 450~1100만 → 4,700,000 / 관리비 5만/년
 *   서비스: 5년 개인단 25만, 10년 개인단 50만, 5년 가족단 50만, 10년 가족단 100만
 *
 * 672 봉정추모관 → 공홈 이미지
 *   https://bjcmp.co.kr/
 *   1층/2층/고급실 × 개인단/부부단 (1~10단)
 *   관리비 5년 선납: 개인단 36만 / 부부단 72만
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const updates = [];

    // ===== 669 안동하늘공원 =====
    const p669 = data.find(x => x.id === 'park-0669');
    if (p669) {
        p669.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '개인단 (유연고)', unit: '원', rows: [
                    { name: '사용료', price: 300000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료', price: 900000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '부부단 (유연고)', unit: '원', rows: [
                    { name: '사용료', price: 500000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료', price: 1500000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '무연고', unit: '원', rows: [
                    { name: '사용료', price: 70000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료', price: 210000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0669', p: p669 });
        console.log('✅', p669.id, p669.name);
    }

    // ===== 670 금산군공설봉안당 =====
    const p670 = data.find(x => x.id === 'park-0670');
    if (p670) {
        p670.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '유연고', unit: '원', rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '관리비', price: 50000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '사용료 (관외자)', price: 200000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '유연고 (수급자·보훈·유공자)', unit: '원', rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', residency: 'VETERAN' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '무연고', unit: '원', rows: [
                    { name: '사용료', price: 50000, feeType: 'USAGE' },
                    { name: '관리비', price: 25000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0670', p: p670 });
        console.log('✅', p670.id, p670.name);
    }

    // ===== 671 재단법인청림공원(봉안당) =====
    const p671 = data.find(x => x.id === 'park-0671');
    if (p671) {
        p671.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원', rows: [
                    { name: '사용료', price: 2700000, feeType: 'USAGE', isRepresentative: true, grade: '250~600만원' },
                    { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원', rows: [
                    { name: '사용료', price: 4700000, feeType: 'USAGE', grade: '450~1,100만원' },
                    { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관리비 선납', unit: '원', rows: [
                    { name: '5년 개인단', price: 250000, feeType: 'MAINTENANCE' },
                    { name: '10년 개인단', price: 500000, feeType: 'MAINTENANCE' },
                    { name: '5년 가족단', price: 500000, feeType: 'MAINTENANCE' },
                    { name: '10년 가족단', price: 1000000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0671', p: p671 });
        console.log('✅', p671.id, p671.name);
    }

    // ===== 672 봉정추모관 =====
    const p672 = data.find(x => x.id === 'park-0672');
    if (p672) {
        p672.websiteUrl = 'https://bjcmp.co.kr';
        p672.priceInfo.standardizedPrices = [
            // 1층 - 개인단
            {
                serviceType: 'BONGSAN', subType: '1층', groupType: '개인단', unit: '원', rows: [
                    { name: '10단', price: 2300000, feeType: 'USAGE' },
                    { name: '9단', price: 2700000, feeType: 'USAGE' },
                    { name: '8단', price: 3300000, feeType: 'USAGE' },
                    { name: '7단', price: 4100000, feeType: 'USAGE' },
                    { name: '6단', price: 4700000, feeType: 'USAGE' },
                    { name: '5단', price: 5000000, feeType: 'USAGE' },
                    { name: '4단', price: 5000000, feeType: 'USAGE' },
                    { name: '3단', price: 4700000, feeType: 'USAGE' },
                    { name: '2단', price: 4000000, feeType: 'USAGE' },
                    { name: '1단', price: 3300000, feeType: 'USAGE' },
                ]
            },
            // 1층 - 부부단
            {
                serviceType: 'BONGSAN', subType: '1층', groupType: '부부단', unit: '원', rows: [
                    { name: '10단', price: 4600000, feeType: 'USAGE' },
                    { name: '9단', price: 5400000, feeType: 'USAGE' },
                    { name: '8단', price: 6600000, feeType: 'USAGE' },
                    { name: '7단', price: 8000000, feeType: 'USAGE' },
                    { name: '6단', price: 9000000, feeType: 'USAGE' },
                    { name: '5단', price: 10000000, feeType: 'USAGE' },
                    { name: '4단', price: 10000000, feeType: 'USAGE' },
                    { name: '3단', price: 9000000, feeType: 'USAGE' },
                    { name: '2단', price: 8000000, feeType: 'USAGE' },
                    { name: '1단', price: 6600000, feeType: 'USAGE' },
                ]
            },
            // 2층 - 개인단
            {
                serviceType: 'BONGSAN', subType: '2층', groupType: '개인단', unit: '원', rows: [
                    { name: '10단', price: 2900000, feeType: 'USAGE' },
                    { name: '9단', price: 3300000, feeType: 'USAGE' },
                    { name: '8단', price: 3900000, feeType: 'USAGE' },
                    { name: '7단', price: 4500000, feeType: 'USAGE' },
                    { name: '6단', price: 6000000, feeType: 'USAGE' },
                    { name: '5단', price: 6500000, feeType: 'USAGE', isRepresentative: true },
                    { name: '4단', price: 6000000, feeType: 'USAGE' },
                    { name: '3단', price: 5500000, feeType: 'USAGE' },
                    { name: '2단', price: 4600000, feeType: 'USAGE' },
                    { name: '1단', price: 3500000, feeType: 'USAGE' },
                ]
            },
            // 2층 - 부부단
            {
                serviceType: 'BONGSAN', subType: '2층', groupType: '부부단', unit: '원', rows: [
                    { name: '10단', price: 5700000, feeType: 'USAGE' },
                    { name: '9단', price: 6600000, feeType: 'USAGE' },
                    { name: '8단', price: 7600000, feeType: 'USAGE' },
                    { name: '7단', price: 9000000, feeType: 'USAGE' },
                    { name: '6단', price: 12000000, feeType: 'USAGE' },
                    { name: '5단', price: 13000000, feeType: 'USAGE' },
                    { name: '4단', price: 12000000, feeType: 'USAGE' },
                    { name: '3단', price: 11000000, feeType: 'USAGE' },
                    { name: '2단', price: 9000000, feeType: 'USAGE' },
                    { name: '1단', price: 7000000, feeType: 'USAGE' },
                ]
            },
            // 고급실 - 개인단
            {
                serviceType: 'BONGSAN', subType: '고급실', groupType: '개인단', unit: '원', rows: [
                    { name: '10단', price: 4000000, feeType: 'USAGE' },
                    { name: '9단', price: 4500000, feeType: 'USAGE' },
                    { name: '8단', price: 5550000, feeType: 'USAGE' },
                    { name: '7단', price: 6500000, feeType: 'USAGE' },
                    { name: '6단', price: 7500000, feeType: 'USAGE' },
                    { name: '5단', price: 8500000, feeType: 'USAGE' },
                    { name: '4단', price: 7500000, feeType: 'USAGE' },
                    { name: '3단', price: 6500000, feeType: 'USAGE' },
                    { name: '2단', price: 5550000, feeType: 'USAGE' },
                    { name: '1단', price: 4500000, feeType: 'USAGE' },
                ]
            },
            // 고급실 - 부부단
            {
                serviceType: 'BONGSAN', subType: '고급실', groupType: '부부단', unit: '원', rows: [
                    { name: '10단', price: 8000000, feeType: 'USAGE' },
                    { name: '9단', price: 9000000, feeType: 'USAGE' },
                    { name: '8단', price: 11000000, feeType: 'USAGE' },
                    { name: '7단', price: 13000000, feeType: 'USAGE' },
                    { name: '6단', price: 15000000, feeType: 'USAGE' },
                    { name: '5단', price: 17000000, feeType: 'USAGE' },
                    { name: '4단', price: 15000000, feeType: 'USAGE' },
                    { name: '3단', price: 13000000, feeType: 'USAGE' },
                    { name: '2단', price: 11000000, feeType: 'USAGE' },
                    { name: '1단', price: 9000000, feeType: 'USAGE' },
                    // 관리비
                    { name: '관리비 (개인단)', price: 360000, feeType: 'MAINTENANCE', grade: '5년 선납, 1위 기준' },
                    { name: '관리비 (부부단)', price: 720000, feeType: 'MAINTENANCE', grade: '5년 선납, 2위 기준' },
                ]
            },
        ];
        updates.push({ id: 'park-0672', p: p672, websiteUrl: true });
        console.log('✅', p672.id, p672.name);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    for (const u of updates) {
        const updateData = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.websiteUrl) updateData.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(updateData).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
