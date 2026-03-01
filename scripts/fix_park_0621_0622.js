/**
 * park-0621 영봉추모공원 + park-0622 강촌추모원 가격 정리
 * 출처: e하늘 (archive5_images)
 * - 621: 복합단 쪼개기 (1단,8단 → 1단 + 8단), 개인/부부 분리
 * - 622: 봉안당/봉안담/봉안탑/수목장 정리, 복합단 쪼개기
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

    // ========== park-0621 영봉추모공원 ==========
    const p1 = data.find(x => x.id === 'park-0621');
    if (!p1) { console.log('NOT FOUND: park-0621'); return; }
    if (!p1.priceInfo) p1.priceInfo = {};

    // 이미지: 개인(1단,8단=150만 / 2단,7단=180만 / 3단=220만 / F단,6단=250만 / 5단=가격없음)
    //         부부(1단,8단=280만 / 2단,7단=320만 / 3단=400만 / F단,6단=450만 / 5단=500만)
    // 사용금내역: 30×30
    p1.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
            rows: [
                { name: '1단', price: 1500000, feeType: 'USAGE', isRepresentative: true },
                { name: '2단', price: 1800000, feeType: 'USAGE' },
                { name: '3단', price: 2200000, feeType: 'USAGE' },
                { name: 'F단', price: 2500000, feeType: 'USAGE' },
                { name: '6단', price: 2500000, feeType: 'USAGE' },
                { name: '7단', price: 1800000, feeType: 'USAGE' },
                { name: '8단', price: 1500000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
            rows: [
                { name: '1단', price: 2800000, feeType: 'USAGE' },
                { name: '2단', price: 3200000, feeType: 'USAGE' },
                { name: '3단', price: 4000000, feeType: 'USAGE' },
                { name: 'F단', price: 4500000, feeType: 'USAGE' },
                { name: '5단', price: 5000000, feeType: 'USAGE' },
                { name: '6단', price: 4500000, feeType: 'USAGE' },
                { name: '7단', price: 3200000, feeType: 'USAGE' },
                { name: '8단', price: 2800000, feeType: 'USAGE' },
            ]
        },
    ];

    console.log('✅ park-0621 영봉추모공원 세팅 완료');

    // ========== park-0622 강촌추모원 ==========
    const p2 = data.find(x => x.id === 'park-0622');
    if (!p2) { console.log('NOT FOUND: park-0622'); return; }
    if (!p2.priceInfo) p2.priceInfo = {};

    // 이미지:
    // 봉안당 개인형: 3단~7단=300만(관리비 년5만), 1,2,8단=250만(관리비 년5만)
    //              10년봉안형 1,2,8단=150만(관리비포함)
    // 봉안당 부부형: 3단~7단=500만(관리비 년10만)
    // 야외가족묘(봉안담): 1단=450만, 2단,5단=500만, 3단,4단=600만 (8기형)
    // 봉안탑: A형=1500만(12기), B형=2000만(24기)
    // 탑식수목장: 250만(조형물+수목)
    p2.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
            rows: [
                { name: '3단~7단', price: 3000000, feeType: 'USAGE', grade: '관리비: 년 5만원', isRepresentative: true },
                { name: '1단', price: 2500000, feeType: 'USAGE', grade: '관리비: 년 5만원' },
                { name: '2단', price: 2500000, feeType: 'USAGE', grade: '관리비: 년 5만원' },
                { name: '8단', price: 2500000, feeType: 'USAGE', grade: '관리비: 년 5만원' },
                { name: '10년봉안형 (1,2,8단)', price: 1500000, feeType: 'USAGE', grade: '관리비 포함' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
            rows: [
                { name: '3단~7단', price: 5000000, feeType: 'USAGE', grade: '관리비: 년 10만원' },
            ]
        },
        // 야외 봉안담 → BURIAL (가이드8: 야외형은 BURIAL)
        {
            serviceType: 'BURIAL', subType: '야외가족묘(봉안담)', unit: '원',
            rows: [
                { name: '1단', price: 4500000, feeType: 'USAGE', grade: '8기형, 관리비: 1기 5만원 / 2기 이상 10만원', isRepresentative: true },
                { name: '2단', price: 5000000, feeType: 'USAGE', grade: '8기형, 관리비: 년 10만원' },
                { name: '3단', price: 6000000, feeType: 'USAGE', grade: '8기형, 관리비: 년 10만원' },
                { name: '4단', price: 6000000, feeType: 'USAGE', grade: '8기형, 관리비: 년 10만원' },
                { name: '5단', price: 5000000, feeType: 'USAGE', grade: '8기형, 관리비: 년 10만원' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안탑', unit: '원',
            rows: [
                { name: 'A형', price: 15000000, feeType: 'USAGE', grade: '12기, 관리비: 년 10만원' },
                { name: 'B형', price: 20000000, feeType: 'USAGE', grade: '24기, 관리비: 년 10만원' },
            ]
        },
        {
            serviceType: 'NATURAL', subType: '수목장', unit: '원',
            rows: [
                { name: '탑식수목장', price: 2500000, feeType: 'USAGE', grade: '조형물+수목, 관리비: 년 5만원', isRepresentative: true },
            ]
        },
    ];

    console.log('✅ park-0622 강촌추모원 세팅 완료');

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    for (const id of ['park-0621', 'park-0622']) {
        const f = data.find(d => d.id === id);
        const updateData = { pricing: JSON.stringify(f.priceInfo) };
        if (f.websiteUrl) updateData.websiteUrl = f.websiteUrl;
        const { error } = await supabase.from('Facility').update(updateData).eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('☁️', id, f.name, 'Supabase 동기화 완료');
    }
}

fix();
