/**
 * park-0623 서대산추모공원 봉안당
 * park-0624 효천추모공원
 * park-0625 학천사추모관
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

    function update(id, fn) {
        const p = data.find(x => x.id === id);
        if (!p) { console.log('NOT FOUND:', id); return; }
        if (!p.priceInfo) p.priceInfo = {};
        fn(p);
        console.log('✅', id, p.name);
    }

    // ========== park-0623 서대산추모공원 봉안당 ==========
    // 출처: archive5 이미지 + 공홈 http://www.서대산추모공원.com
    // 복합단 쪼개기: 1단,9단 / 2단,8단 / 3단,7단
    update('park-0623', p => {
        p.websiteUrl = 'http://www.xn--ob0bp8i99gpugnpa27ylkm.com';
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
                rows: [
                    { name: '1단', price: 3000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '2단', price: 3500000, feeType: 'USAGE' },
                    { name: '3단', price: 4000000, feeType: 'USAGE' },
                    { name: '4단', price: 4500000, feeType: 'USAGE' },
                    { name: '5단', price: 4500000, feeType: 'USAGE' },
                    { name: '6단', price: 4500000, feeType: 'USAGE' },
                    { name: '7단', price: 4000000, feeType: 'USAGE' },
                    { name: '8단', price: 3500000, feeType: 'USAGE' },
                    { name: '9단', price: 3000000, feeType: 'USAGE' },
                    { name: '년 관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1위 기준' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
                rows: [
                    { name: '1단', price: 6000000, feeType: 'USAGE' },
                    { name: '2단', price: 7000000, feeType: 'USAGE' },
                    { name: '3단', price: 8000000, feeType: 'USAGE' },
                    { name: '4단', price: 9000000, feeType: 'USAGE' },
                    { name: '5단', price: 9000000, feeType: 'USAGE' },
                    { name: '6단', price: 9000000, feeType: 'USAGE' },
                    { name: '7단', price: 8000000, feeType: 'USAGE' },
                    { name: '8단', price: 7000000, feeType: 'USAGE' },
                    { name: '9단', price: 6000000, feeType: 'USAGE' },
                    { name: '년 관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1위 기준' },
                ]
            },
        ];
    });

    // ========== park-0624 효천추모공원 ==========
    // 출처: 공홈 이미지 (유저 제공)
    // 2층: A동(A2,A3) + D동(D1,D2) / 3층: C동(C1) + D동(D1,D2)
    // 단위: 만원
    update('park-0624', p => {
        p.websiteUrl = 'https://hyocheon1.cafe24.com';
        p.priceInfo.standardizedPrices = [
            // 2층 A동 (A2, A3)
            {
                serviceType: 'BONGSAN', subType: '2층 A동(A2,A3)', unit: '원',
                groupType: '개인단',
                rows: [
                    { name: '1단', price: 2000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '2단', price: 3000000, feeType: 'USAGE' },
                    { name: '3단', price: 4000000, feeType: 'USAGE' },
                    { name: '4단', price: 5000000, feeType: 'USAGE' },
                    { name: '5단', price: 5000000, feeType: 'USAGE' },
                    { name: '6단', price: 4000000, feeType: 'USAGE' },
                    { name: '7단', price: 3000000, feeType: 'USAGE' },
                    { name: '8단', price: 2000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '2층 A동(A2,A3)', unit: '원',
                groupType: '부부단',
                rows: [
                    { name: '1단', price: 4000000, feeType: 'USAGE' },
                    { name: '2단', price: 6000000, feeType: 'USAGE' },
                    { name: '3단', price: 8000000, feeType: 'USAGE' },
                    { name: '4단', price: 10000000, feeType: 'USAGE' },
                    { name: '5단', price: 10000000, feeType: 'USAGE' },
                    { name: '6단', price: 8000000, feeType: 'USAGE' },
                    { name: '7단', price: 6000000, feeType: 'USAGE' },
                    { name: '8단', price: 4000000, feeType: 'USAGE' },
                ]
            },
            // 2층 D동 (D1, D2)
            {
                serviceType: 'BONGSAN', subType: '2층 D동(D1,D2)', unit: '원',
                groupType: '개인단',
                rows: [
                    { name: '1단', price: 3000000, feeType: 'USAGE' },
                    { name: '2단', price: 4000000, feeType: 'USAGE' },
                    { name: '3단', price: 5000000, feeType: 'USAGE' },
                    { name: '4단', price: 6000000, feeType: 'USAGE' },
                    { name: '5단', price: 6000000, feeType: 'USAGE' },
                    { name: '6단', price: 5000000, feeType: 'USAGE' },
                    { name: '7단', price: 4000000, feeType: 'USAGE' },
                    { name: '8단', price: 3000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '2층 D동(D1,D2)', unit: '원',
                groupType: '부부단',
                rows: [
                    { name: '1단', price: 6000000, feeType: 'USAGE' },
                    { name: '2단', price: 8000000, feeType: 'USAGE' },
                    { name: '3단', price: 10000000, feeType: 'USAGE' },
                    { name: '4단', price: 12000000, feeType: 'USAGE' },
                    { name: '5단', price: 12000000, feeType: 'USAGE' },
                    { name: '6단', price: 10000000, feeType: 'USAGE' },
                    { name: '7단', price: 8000000, feeType: 'USAGE' },
                    { name: '8단', price: 6000000, feeType: 'USAGE' },
                ]
            },
            // 3층 C동 (C1)
            {
                serviceType: 'BONGSAN', subType: '3층 C동(C1)', unit: '원',
                groupType: '개인단',
                rows: [
                    { name: '1단', price: 2000000, feeType: 'USAGE' },
                    { name: '2단', price: 3000000, feeType: 'USAGE' },
                    { name: '3단', price: 4000000, feeType: 'USAGE' },
                    { name: '4단', price: 5000000, feeType: 'USAGE' },
                    { name: '5단', price: 5000000, feeType: 'USAGE' },
                    { name: '6단', price: 4000000, feeType: 'USAGE' },
                    { name: '7단', price: 3000000, feeType: 'USAGE' },
                    { name: '8단', price: 2000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '3층 C동(C1)', unit: '원',
                groupType: '부부단',
                rows: [
                    { name: '1단', price: 4000000, feeType: 'USAGE' },
                    { name: '2단', price: 6000000, feeType: 'USAGE' },
                    { name: '3단', price: 8000000, feeType: 'USAGE' },
                    { name: '4단', price: 10000000, feeType: 'USAGE' },
                    { name: '5단', price: 10000000, feeType: 'USAGE' },
                    { name: '6단', price: 8000000, feeType: 'USAGE' },
                    { name: '7단', price: 6000000, feeType: 'USAGE' },
                    { name: '8단', price: 4000000, feeType: 'USAGE' },
                ]
            },
            // 3층 D동 (D1, D2)
            {
                serviceType: 'BONGSAN', subType: '3층 D동(D1,D2)', unit: '원',
                groupType: '개인단',
                rows: [
                    { name: '1단', price: 3000000, feeType: 'USAGE' },
                    { name: '2단', price: 4000000, feeType: 'USAGE' },
                    { name: '3단', price: 5000000, feeType: 'USAGE' },
                    { name: '4단', price: 6000000, feeType: 'USAGE' },
                    { name: '5단', price: 6000000, feeType: 'USAGE' },
                    { name: '6단', price: 5000000, feeType: 'USAGE' },
                    { name: '7단', price: 4000000, feeType: 'USAGE' },
                    { name: '8단', price: 3000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '3층 D동(D1,D2)', unit: '원',
                groupType: '부부단',
                rows: [
                    { name: '1단', price: 6000000, feeType: 'USAGE' },
                    { name: '2단', price: 8000000, feeType: 'USAGE' },
                    { name: '3단', price: 10000000, feeType: 'USAGE' },
                    { name: '4단', price: 12000000, feeType: 'USAGE' },
                    { name: '5단', price: 12000000, feeType: 'USAGE' },
                    { name: '6단', price: 10000000, feeType: 'USAGE' },
                    { name: '7단', price: 8000000, feeType: 'USAGE' },
                    { name: '8단', price: 6000000, feeType: 'USAGE' },
                ]
            },
        ];
    });

    // ========== park-0625 학천사추모관 ==========
    // 출처: 유저 제공 이미지 (공홈)
    // 영구안치: 특별단/일반단, 개인/부부
    // 기간제: 특실/일반실
    // 6,3,2단은 비어있음 (분양완료)
    update('park-0625', p => {
        // websiteUrl은 유저가 아직 안 줬으므로, 나중에 추가
        p.priceInfo.standardizedPrices = [
            // 영구안치 - 특별단
            {
                serviceType: 'BONGSAN', subType: '영구안치(특별단)', unit: '원',
                groupType: '개인',
                rows: [
                    { name: '1단', price: 2200000, feeType: 'USAGE', isRepresentative: true },
                    { name: '5단', price: 2700000, feeType: 'USAGE' },
                    { name: '7단', price: 2200000, feeType: 'USAGE' },
                    { name: '8단', price: 2000000, feeType: 'USAGE' },
                    { name: '9단', price: 1500000, feeType: 'USAGE' },
                    { name: '관리비', price: 20000, feeType: 'MAINTENANCE', grade: '1년, 안치 시 5년 선납' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '영구안치(특별단)', unit: '원',
                groupType: '부부',
                rows: [
                    { name: '1단', price: 4100000, feeType: 'USAGE' },
                    { name: '5단', price: 4800000, feeType: 'USAGE' },
                    { name: '7단', price: 4100000, feeType: 'USAGE' },
                    { name: '8단', price: 3700000, feeType: 'USAGE' },
                    { name: '9단', price: 3000000, feeType: 'USAGE' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년, 안치 시 5년 선납' },
                ]
            },
            // 영구안치 - 일반단
            {
                serviceType: 'BONGSAN', subType: '영구안치(일반단)', unit: '원',
                groupType: '개인',
                rows: [
                    { name: '1단', price: 1900000, feeType: 'USAGE' },
                    { name: '5단', price: 2300000, feeType: 'USAGE' },
                    { name: '7단', price: 1900000, feeType: 'USAGE' },
                    { name: '8단', price: 1500000, feeType: 'USAGE' },
                    { name: '9단', price: 1000000, feeType: 'USAGE' },
                    { name: '관리비', price: 20000, feeType: 'MAINTENANCE', grade: '1년, 안치 시 5년 선납' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '영구안치(일반단)', unit: '원',
                groupType: '부부',
                rows: [
                    { name: '1단', price: 3500000, feeType: 'USAGE' },
                    { name: '5단', price: 4200000, feeType: 'USAGE' },
                    { name: '7단', price: 3500000, feeType: 'USAGE' },
                    { name: '8단', price: 2900000, feeType: 'USAGE' },
                    { name: '9단', price: 2000000, feeType: 'USAGE' },
                    { name: '관리비', price: 30000, feeType: 'MAINTENANCE', grade: '1년, 안치 시 5년 선납' },
                ]
            },
            // 기간제
            {
                serviceType: 'BONGSAN', subType: '기간제', unit: '원',
                rows: [
                    { name: '특실 (개인)', price: 650000, feeType: 'USAGE' },
                    { name: '특실 (부부)', price: 1200000, feeType: 'USAGE' },
                    { name: '일반실 (개인)', price: 500000, feeType: 'USAGE' },
                    { name: '일반실 (부부)', price: 950000, feeType: 'USAGE' },
                ]
            },
        ];
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    for (const id of ['park-0623', 'park-0624', 'park-0625']) {
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
