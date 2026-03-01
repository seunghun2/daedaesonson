/**
 * park-0677~0679 아카이브 + park-0710 공홈 일괄 처리
 *
 * 677 진천군 추모의집 → 아카이브
 *   관내거주자 단장 376,000 / 합장 628,000 (30년, 15년1회연장)
 *   관외거주자 단장 488,000 / 합장 817,000
 *   관내유연고 개장유골 단장 742,000 / 합장 1,256,000
 *
 * 678 홍천군공설묘원 봉안당 → 아카이브
 *   합장묘 관내 1,500,000 / 단장묘 관내 1,125,000 (15년)
 *   봉안묘 관내 375,000
 *   봉안당 개인 관내 300,000 / 부부 600,000 (15년)
 *   봉안당 무연고 관내 300,000 (10년)
 *
 * 679 관음사추모관 → 아카이브
 *   1층 개인 1~6단 영구 100~250만 → 1,000,000
 *   1층 부부 1~6단 영구 200~500만 → 2,000,000
 *   2층 부처님전(개인) 1~9단 영구 130~350만 → 1,300,000
 *   2층 부처님전(부부) 1~9단 영구 260~700만 → 2,600,000
 *   관리비 10년/15년/40년 → 1,500,000 (문의)
 *
 * 710 군위추모공원 → 공홈
 *   http://www.gunwipark.com/
 *   매장묘: 분양 5,800,000 / 예약 4,500,000 (30년, 석물비 별도)
 *   봉안당: 분양 2,500,000 / 예약 1,800,000 (30년, 관리비 포함)
 *   봉안담 개인: 분양 5,800,000 / 예약 4,500,000 (영구)
 *   봉안담 부부: 분양 10,600,000 / 예약 8,000,000 (영구)
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

    // ===== 677 진천군 추모의집 =====
    const p677 = data.find(x => x.id === 'park-0677');
    if (p677) {
        p677.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관내거주자', unit: '원', rows: [
                    { name: '단장', price: 376000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL', grade: '30년 (15년+1회 연장)' },
                    { name: '합장', price: 628000, feeType: 'USAGE', residency: 'LOCAL', grade: '30년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관외거주자', unit: '원', rows: [
                    { name: '단장', price: 488000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '30년' },
                    { name: '합장', price: 817000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '30년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관내유연고 개장유골', unit: '원', rows: [
                    { name: '단장', price: 742000, feeType: 'USAGE', residency: 'LOCAL', grade: '30년' },
                    { name: '합장', price: 1256000, feeType: 'USAGE', residency: 'LOCAL', grade: '30년' },
                ]
            },
        ];
        updates.push({ id: 'park-0677', p: p677 });
        console.log('✅', p677.id, p677.name);
    }

    // ===== 678 홍천군공설묘원 봉안당 =====
    const p678 = data.find(x => x.id === 'park-0678');
    if (p678) {
        p678.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '묘지', groupType: '관내', unit: '원', rows: [
                    { name: '합장묘', price: 1500000, feeType: 'USAGE', grade: '15년' },
                    { name: '단장묘', price: 1125000, feeType: 'USAGE', grade: '15년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안묘', groupType: '관내', unit: '원', rows: [
                    { name: '사용료', price: 375000, feeType: 'USAGE', grade: '15년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관내', unit: '원', rows: [
                    { name: '개인', price: 300000, feeType: 'USAGE', isRepresentative: true, grade: '15년' },
                    { name: '부부', price: 600000, feeType: 'USAGE', grade: '15년' },
                    { name: '무연고', price: 300000, feeType: 'USAGE', grade: '10년' },
                ]
            },
        ];
        updates.push({ id: 'park-0678', p: p678 });
        console.log('✅', p678.id, p678.name);
    }

    // ===== 679 관음사추모관 =====
    const p679 = data.find(x => x.id === 'park-0679');
    if (p679) {
        p679.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '1층', groupType: '개인 (1~6단)', unit: '원', rows: [
                    { name: '사용료', price: 1000000, feeType: 'USAGE', isRepresentative: true, grade: '영구, 100~250만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '1층', groupType: '부부 (1~6단)', unit: '원', rows: [
                    { name: '사용료', price: 2000000, feeType: 'USAGE', grade: '영구, 200~500만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '2층 부처님전', groupType: '개인 (1~9단)', unit: '원', rows: [
                    { name: '사용료', price: 1300000, feeType: 'USAGE', grade: '영구, 130~350만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '2층 부처님전', groupType: '부부 (1~9단)', unit: '원', rows: [
                    { name: '사용료', price: 2600000, feeType: 'USAGE', grade: '영구, 260~700만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '공통', groupType: '관리비', unit: '원', rows: [
                    { name: '관리비 (10년/15년/40년)', price: 1500000, feeType: 'MAINTENANCE', grade: '관리자에게 문의' },
                ]
            },
        ];
        updates.push({ id: 'park-0679', p: p679 });
        console.log('✅', p679.id, p679.name);
    }

    // ===== 710 군위추모공원 =====
    const p710 = data.find(x => x.id === 'park-0710');
    if (p710) {
        p710.websiteUrl = 'http://www.gunwipark.com';
        p710.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', groupType: '분양', unit: '원', rows: [
                    { name: '분양가', price: 5800000, feeType: 'USAGE', grade: '30년, 석물비 별도, 신자만 가능' },
                    { name: '예약가', price: 4500000, feeType: 'USAGE', grade: '사전예약' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '분양', unit: '원', rows: [
                    { name: '분양가', price: 2500000, feeType: 'USAGE', isRepresentative: true, grade: '30년, 관리비 포함' },
                    { name: '예약가', price: 1800000, feeType: 'USAGE', grade: '순차적 분양 (자리지정 불가)' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '개인단', unit: '원', rows: [
                    { name: '분양가', price: 5800000, feeType: 'USAGE', grade: '영구' },
                    { name: '예약가', price: 4500000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '부부단', unit: '원', rows: [
                    { name: '분양가', price: 10600000, feeType: 'USAGE', grade: '영구' },
                    { name: '예약가', price: 8000000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0710', p: p710, websiteUrl: true });
        console.log('✅', p710.id, p710.name);
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
