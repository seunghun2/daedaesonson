/**
 * park-0683~0686 일괄 처리
 *
 * 683 (재)자하연팔당(봉안) → 아카이브+공홈 jahayeon.com
 *   탑형(2위,3평) 13,500,000 (사용료735만+관리비5년40.5만+석물비574.5만)
 *   탑형(4위,3평) 15,500,000
 *   평장(6위,3평) 21,500,000
 *   탑형(8위,5평) 25,500,000
 *   와형(12위,6평) 31,500,000
 *   와형(16위,6평) 33,500,000
 *
 * 684 정선하늘공원 → 공홈 https://m.jsimc.or.kr/
 *   매장묘: 단장 2,973,000 / 합장 3,440,000
 *   가족봉안묘(12기) 5,206,000
 *   봉안시설(15년): 개인 관내 300,000 / 관외 1,000,000
 *   부부: 관내 500,000 / 관외 1,500,000
 *   무연유골(10년): 관내 150,000 / 관외 300,000
 *
 * 685 예은추모공원 → 공홈 http://www.yeaeunpark.com/
 *   사용료 20만 (강남구 주민) / 30만 (직계존비속·사업체) / 5만 (감면)
 *   부부단: 2배 / 관리비: 36,000/년 × 20년 = 720,000
 *
 * 686 용산성당 베다니아의집 → 아카이브+공홈
 *   봉안단 300×300(3,4,5단) 10,000,000
 *   봉안단 300×300(2,6단) 9,000,000
 *   봉안단 300×300(1,7단) 8,000,000
 *   봉안단 300×600(3,4,5단) 18,000,000
 *   봉안단 300×600(2,6단) 16,000,000
 *   봉안단 300×600(1,7단) 14,000,000
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

    // ===== 683 (재)자하연팔당(봉안) =====
    const p683 = data.find(x => x.id === 'park-0683');
    if (p683) {
        p683.websiteUrl = 'https://jahayeon.com';
        p683.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안', groupType: '합계 (사용료+관리비5년+석물비)', unit: '원', rows: [
                    { name: '탑형 2위 (3평)', price: 13500000, feeType: 'USAGE', isRepresentative: true, grade: '사용료735만+관리비40.5만+석물574.5만' },
                    { name: '탑형 4위 (3평)', price: 15500000, feeType: 'USAGE', grade: '사용료735만+관리비40.5만+석물774.5만' },
                    { name: '평장 6위 (3평)', price: 21500000, feeType: 'USAGE', grade: '사용료735만+관리비40.5만+석물1374.5만' },
                    { name: '탑형 8위 (5평)', price: 25500000, feeType: 'USAGE', grade: '사용료1225만+관리비67.5만+석물1257.5만' },
                    { name: '와형 12위 (6평)', price: 31500000, feeType: 'USAGE', grade: '사용료1470만+관리비81만+석물1599만' },
                    { name: '와형 16위 (6평)', price: 33500000, feeType: 'USAGE', grade: '사용료1470만+관리비81만+석물1799만' },
                ]
            },
        ];
        updates.push({ id: 'park-0683', p: p683, ws: true });
        console.log('✅', p683.id, p683.name);
    }

    // ===== 684 정선하늘공원 =====
    const p684 = data.find(x => x.id === 'park-0684');
    if (p684) {
        p684.websiteUrl = 'https://m.jsimc.or.kr/layout/basic/page/page2/page07.html';
        p684.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', groupType: '군 조례 지정비용 + 부대비용', unit: '원', rows: [
                    { name: '단장', price: 2973000, feeType: 'USAGE', grade: '사용료923,000+관리비300,000+매장비750,000+석물비1,000,000' },
                    { name: '합장', price: 3440000, feeType: 'USAGE', grade: '사용료1,200,000+관리비390,000+매장비750,000+석물비1,100,000' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '가족봉안묘', groupType: '12기', unit: '원', rows: [
                    { name: '합계', price: 5206000, feeType: 'USAGE', grade: '사용료1,476,000+관리비480,000+매장비750,000+석물비2,500,000' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '매장묘', groupType: '석물설치 관리비', unit: '원', rows: [
                    { name: '관리비', price: 126000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '유연유골 (15년)', unit: '원', rows: [
                    { name: '개인단 관내 (정선군민)', price: 300000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '개인단 관외', price: 1000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                    { name: '부부단 관내', price: 500000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '부부단 관외', price: 1500000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '연장사용료', unit: '원', rows: [
                    { name: '개인단', price: 300000, feeType: 'USAGE' },
                    { name: '부부단', price: 500000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '무연유골 (10년)', unit: '원', rows: [
                    { name: '관내', price: 150000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '관외', price: 300000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0684', p: p684, ws: true });
        console.log('✅', p684.id, p684.name);
    }

    // ===== 685 예은추모공원 =====
    const p685 = data.find(x => x.id === 'park-0685');
    if (p685) {
        p685.websiteUrl = 'http://www.yeaeunpark.com';
        p685.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단 (20년)', unit: '원', rows: [
                    { name: '강남구 주민등록자 및 배우자', price: 200000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '직계존비속·강남구 사업체 근무자', price: 300000, feeType: 'USAGE' },
                    { name: '국가유공자·기초수급자·장애인 등', price: 50000, feeType: 'USAGE', grade: '감면' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관리비 (20년)', unit: '원', rows: [
                    { name: '개인단 (36,000/년 × 20년)', price: 720000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0685', p: p685, ws: true });
        console.log('✅', p685.id, p685.name);
    }

    // ===== 686 용산성당 베다니아의집 =====
    const p686 = data.find(x => x.id === 'park-0686');
    if (p686) {
        p686.websiteUrl = 'https://www.yongsanch.or.kr:8080/menu_group1/greeting.jsp?main_seq=1&sub_seq=90&sub_sub_seq=117';
        p686.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안단', groupType: '개인형 300×300', unit: '원', rows: [
                    { name: '3·4·5단', price: 10000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '2·6단', price: 9000000, feeType: 'USAGE' },
                    { name: '1·7단', price: 8000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안단', groupType: '부부형 300×600', unit: '원', rows: [
                    { name: '3·4·5단', price: 18000000, feeType: 'USAGE' },
                    { name: '2·6단', price: 16000000, feeType: 'USAGE' },
                    { name: '1·7단', price: 14000000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0686', p: p686, ws: true });
        console.log('✅', p686.id, p686.name);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    for (const u of updates) {
        const ud = { pricing: JSON.stringify(u.p.priceInfo) };
        if (u.ws) ud.websiteUrl = u.p.websiteUrl;
        const { error } = await supabase.from('Facility').update(ud).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
