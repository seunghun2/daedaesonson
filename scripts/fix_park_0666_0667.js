/**
 * park-0666 대한불교조계종 해운봉안당 → 아카이브
 *   납골봉안묘/일반단 1위: 90~150만 → 대표 900,000
 *   납골봉안묘/고급단 1위: 150~250만 → 1,500,000
 *   납골봉안묘/문수단 1위: 200~400만 → 2,000,000
 *   납골봉안묘/특별단 1위: 400~600만 → 4,000,000
 *   납골봉안묘/문수단 2위: 400~800만 → 4,000,000
 *   납골봉안묘/특별단 2위: 800~1,000만 → 8,000,000
 *
 * park-0667 여주시 추모공원 → 공홈
 *   https://yeojuuc.or.kr/sub1/memorial/park.do
 *   봉안담: 개인단 관내 400,000+관리비100,000 / 관외 800,000+200,000
 *          부부단 관내 600,000+150,000 / 관외 1,200,000+300,000
 *          15년(2회연장, 총45년)
 *   자연장(잔디형): 개인장 관내 200,000+150,000 / 관외 400,000+300,000
 *                  부부장 관내 300,000+225,000 / 관외 600,000+450,000
 *                  30년(1회연장, 총45년)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const m = n => n * 10000;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const updates = [];

    // ===== 666 해운봉안당 =====
    const p666 = data.find(x => x.id === 'park-0666');
    if (p666) {
        p666.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '납골봉안묘', groupType: '개인단 (1위)', unit: '원', rows: [
                    { name: '일반단', price: m(90), feeType: 'USAGE', isRepresentative: true, grade: '90~150만원' },
                    { name: '고급단', price: m(150), feeType: 'USAGE', grade: '150~250만원' },
                    { name: '문수단', price: m(200), feeType: 'USAGE', grade: '200~400만원' },
                    { name: '특별단', price: m(400), feeType: 'USAGE', grade: '400~600만원' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '납골봉안묘', groupType: '부부단 (2위)', unit: '원', rows: [
                    { name: '문수단', price: m(400), feeType: 'USAGE', grade: '400~800만원' },
                    { name: '특별단', price: m(800), feeType: 'USAGE', grade: '800~1,000만원' },
                ]
            },
        ];
        updates.push({ id: 'park-0666', p: p666 });
        console.log('✅', p666.id, p666.name);
    }

    // ===== 667 여주시 추모공원 =====
    const p667 = data.find(x => x.id === 'park-0667');
    if (p667) {
        p667.websiteUrl = 'https://yeojuuc.or.kr/sub1/memorial/park.do';
        p667.priceInfo.standardizedPrices = [
            // 봉안담 - 개인단
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '개인단', unit: '원', rows: [
                    { name: '이용료', price: 400000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL', grade: '15년 (2회 연장, 총 45년)' },
                    { name: '관리비', price: 100000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '이용료', price: 800000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년' },
                    { name: '관리비', price: 200000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                ]
            },
            // 봉안담 - 부부단
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '부부단', unit: '원', rows: [
                    { name: '이용료', price: 600000, feeType: 'USAGE', residency: 'LOCAL', grade: '15년' },
                    { name: '관리비', price: 150000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '이용료', price: 1200000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                ]
            },
            // 자연장(잔디형) - 개인장
            {
                serviceType: 'NATURAL', subType: '자연장 (잔디형)', groupType: '개인장', unit: '원', rows: [
                    { name: '이용료', price: 200000, feeType: 'USAGE', residency: 'LOCAL', grade: '30년 (1회 연장, 총 45년)' },
                    { name: '관리비', price: 150000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '이용료', price: 400000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '30년' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                ]
            },
            // 자연장(잔디형) - 부부장
            {
                serviceType: 'NATURAL', subType: '자연장 (잔디형)', groupType: '부부장', unit: '원', rows: [
                    { name: '이용료', price: 300000, feeType: 'USAGE', residency: 'LOCAL', grade: '30년' },
                    { name: '관리비', price: 225000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '이용료', price: 600000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '30년' },
                    { name: '관리비', price: 450000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0667', p: p667, websiteUrl: true });
        console.log('✅', p667.id, p667.name);
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
