/**
 * park-0631 (재)여주세종추모공원 봉안당 → 아카이브
 * park-0632 영평사 추모공원 → 아카이브 + 공홈 URL
 * park-0633 월봉사연화원 → 공홈 이미지 가격 + 공홈 URL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const updates = [];

    function update(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        updates.push(id);
        console.log('✅', id, p.name);
    }

    // ========== park-0631 (재)여주세종추모공원 봉안당 ==========
    // 아카이브: 봉안당(개인2M/부부4M), 자연장(개인2M), 납골묘명당(개인3M/부부5M), 관리비
    update('park-0631', p => {
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', unit: '원',
                rows: [
                    { name: '개인단', price: 2000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '부부단', price: 4000000, feeType: 'USAGE' },
                    { name: '관리비 (개인)', price: 50000, feeType: 'MAINTENANCE', grade: '1년, 5년 선납' },
                    { name: '관리비 (부부)', price: 70000, feeType: 'MAINTENANCE', grade: '1년, 5년 선납' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '자연장', unit: '원',
                rows: [
                    { name: '개인단', price: 2000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '납골묘 (명당)', unit: '원',
                rows: [
                    { name: '개인', price: 3000000, feeType: 'USAGE' },
                    { name: '부부', price: 5000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '가족납골 (자연장)', unit: '원',
                rows: [
                    { name: '기당', price: 1000000, feeType: 'USAGE' },
                ]
            },
        ];
    });

    // ========== park-0632 영평사 추모공원 ==========
    // 아카이브: 야외봉안당 1~5단, 개인단/부부단, 영구사용
    // 공홈: https://www.youngpyungsapark.co.kr/
    update('park-0632', p => {
        p.websiteUrl = 'https://www.youngpyungsapark.co.kr';
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '야외봉안당', groupType: '개인단', unit: '원',
                rows: [
                    { name: '1단', price: 4000000, feeType: 'USAGE', isRepresentative: true, grade: '영구사용' },
                    { name: '2단', price: 4500000, feeType: 'USAGE', grade: '영구사용' },
                    { name: '3단', price: 5000000, feeType: 'USAGE', grade: '영구사용' },
                    { name: '4단', price: 6000000, feeType: 'USAGE', grade: '영구사용' },
                    { name: '5단', price: 6000000, feeType: 'USAGE', grade: '영구사용' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '야외봉안당', groupType: '부부단', unit: '원',
                rows: [
                    { name: '1단', price: 8000000, feeType: 'USAGE', grade: '영구사용' },
                    { name: '2단', price: 9000000, feeType: 'USAGE', grade: '영구사용' },
                    { name: '3단', price: 10000000, feeType: 'USAGE', grade: '영구사용' },
                    { name: '4단', price: 12000000, feeType: 'USAGE', grade: '영구사용' },
                    { name: '5단', price: 12000000, feeType: 'USAGE', grade: '영구사용' },
                ]
            },
        ];
    });

    // ========== park-0633 월봉사연화원 ==========
    // 공홈: http://wolbongsa.com/yun.php
    // 이미지 출처: 봉안담(개인단/부부단) + 팔각봉안담(부부단) + 관리비
    // 단위: 만원
    update('park-0633', p => {
        p.websiteUrl = 'http://wolbongsa.com';
        p.priceInfo.standardizedPrices = [
            // 봉안담 - 개인단 (1,3,5,7,9,11,13동 - 총7개동, 380기)
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '개인단', unit: '원',
                rows: [
                    { name: '5단', price: 5500000, feeType: 'USAGE', isRepresentative: true, grade: '1,3,5,7,9,11,13동 (총7개동, 380기)' },
                    { name: '4단', price: 5500000, feeType: 'USAGE' },
                    { name: '3단', price: 5000000, feeType: 'USAGE' },
                    { name: '2단', price: 4500000, feeType: 'USAGE' },
                    { name: '1단', price: 4500000, feeType: 'USAGE' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년, 선납 5년 150,000원' },
                ]
            },
            // 봉안담 - 부부단 (2,4,6,8,10,12,14동 - 총7개동, 185기)
            {
                serviceType: 'BONGSAN', subType: '봉안담', groupType: '부부단', unit: '원',
                rows: [
                    { name: '5단', price: 11000000, feeType: 'USAGE', grade: '2,4,6,8,10,12,14동 (총7개동, 185기)' },
                    { name: '4단', price: 11000000, feeType: 'USAGE' },
                    { name: '3단', price: 10000000, feeType: 'USAGE' },
                    { name: '2단', price: 9000000, feeType: 'USAGE' },
                    { name: '1단', price: 9000000, feeType: 'USAGE' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년, 선납 5년 150,000원' },
                ]
            },
            // 팔각 봉안담 - 부부단 (A,B,C동 - 총3개동, 120기)
            {
                serviceType: 'BONGSAN', subType: '팔각 봉안담', groupType: '부부단', unit: '원',
                rows: [
                    { name: '5단', price: 14000000, feeType: 'USAGE', grade: 'A,B,C동 (총3개동, 120기)' },
                    { name: '4단', price: 14000000, feeType: 'USAGE' },
                    { name: '3단', price: 13000000, feeType: 'USAGE' },
                    { name: '2단', price: 12000000, feeType: 'USAGE' },
                    { name: '1단', price: 12000000, feeType: 'USAGE' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년, 선납 5년 150,000원' },
                ]
            },
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    for (const id of updates) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const updateData = { pricing: JSON.stringify(f.priceInfo) };
        if (f.websiteUrl) updateData.websiteUrl = f.websiteUrl;
        const { error } = await supabase.from('Facility').update(updateData).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('☁️', id, f.name, 'Supabase 동기화 완료');
    }
}

fix();
