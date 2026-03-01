/**
 * park-0649 용주사 봉안당 → 공홈 이미지 (1순위)
 * https://yongjusa.com/
 * 
 * [봉안당] 1~8단 개인단/부부단
 * 1단: 개인 100만 / 부부 200만
 * 2단: 개인 200만 / 부부 400만
 * 3단: 개인 300만 / 부부 600만
 * 4단: 개인 350만 / 부부 700만
 * 5단: 개인 350만 / 부부 700만
 * 6단: 개인 250만 / 부부 500만
 * 7단: 개인 150만 / 부부 300만
 * 8단: 개인 100만 / 부부 200만
 * 관리비: 연 3만원/1위당 (최초 10년 선납)
 *
 * [봉안탑] 화강석 종형탑 1~2기 1000~1500만원
 * 관리비: 연 5만원/1위당 (최초 10년 선납)
 *
 * [수목장] 반송: 개인형 500~800만 / 부부형 600~900만
 *         육송: 1~2기 1500~2500만 (산장수목)
 * 관리비: 연 5만원/1위당 (최초 10년 선납)
 *
 * [잔디장] 개인형 300~350만 / 부부형 400~450만
 * 관리비: 연 5만원/1위당 (최초 10년 선납)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0649');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'https://yongjusa.com';

    p.priceInfo.standardizedPrices = [
        // 봉안당 - 개인단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '1단', price: 1000000, feeType: 'USAGE', isRepresentative: true },
                { name: '2단', price: 2000000, feeType: 'USAGE' },
                { name: '3단', price: 3000000, feeType: 'USAGE' },
                { name: '4단', price: 3500000, feeType: 'USAGE' },
                { name: '5단', price: 3500000, feeType: 'USAGE' },
                { name: '6단', price: 2500000, feeType: 'USAGE' },
                { name: '7단', price: 1500000, feeType: 'USAGE' },
                { name: '8단', price: 1000000, feeType: 'USAGE' },
                { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '10년 선납, 1위당 (연 3만원)' },
            ]
        },
        // 봉안당 - 부부단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '1단', price: 2000000, feeType: 'USAGE' },
                { name: '2단', price: 4000000, feeType: 'USAGE' },
                { name: '3단', price: 6000000, feeType: 'USAGE' },
                { name: '4단', price: 7000000, feeType: 'USAGE' },
                { name: '5단', price: 7000000, feeType: 'USAGE' },
                { name: '6단', price: 5000000, feeType: 'USAGE' },
                { name: '7단', price: 3000000, feeType: 'USAGE' },
                { name: '8단', price: 2000000, feeType: 'USAGE' },
                { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '10년 선납, 1위당 (연 3만원)' },
            ]
        },
        // 봉안탑
        {
            serviceType: 'BONGSAN', subType: '봉안탑', unit: '원',
            rows: [
                { name: '화강석 종형탑', price: 10000000, feeType: 'USAGE', grade: '1~2기, 1000~1500만원 (단석, 황조, 석영 기본 포함)' },
                { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '10년 선납, 1위당 (연 5만원)' },
            ]
        },
        // 수목장 - 반송
        {
            serviceType: 'NATURAL', subType: '수목장', groupType: '반송', unit: '원',
            rows: [
                { name: '개인형 (1기)', price: 5000000, feeType: 'USAGE', isRepresentative: true, grade: '500~800만원' },
                { name: '부부형 (2기)', price: 6000000, feeType: 'USAGE', grade: '600~900만원' },
                { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '10년 선납, 1위당 (연 5만원)' },
            ]
        },
        // 수목장 - 육송
        {
            serviceType: 'NATURAL', subType: '수목장', groupType: '육송', unit: '원',
            rows: [
                { name: '사용료 (1~2기)', price: 15000000, feeType: 'USAGE', grade: '산장수목, 1500~2500만원' },
                { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '10년 선납, 1위당 (연 5만원)' },
            ]
        },
        // 잔디장 (평장)
        {
            serviceType: 'NATURAL', subType: '잔디장', unit: '원',
            rows: [
                { name: '개인형 (1기)', price: 3000000, feeType: 'USAGE', grade: '300~350만원' },
                { name: '부부형 (2기)', price: 4000000, feeType: 'USAGE', grade: '400~450만원' },
                { name: '관리비', price: 500000, feeType: 'MAINTENANCE', grade: '10년 선납, 1위당 (연 5만원)' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0649');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}
fix();
