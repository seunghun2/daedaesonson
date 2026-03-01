/**
 * park-0694 새로나추모공원 - 각 단 개별 가격으로 수정
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

    const p = data.find(x => x.id === 'park-0694');
    if (!p) { console.log('not found'); return; }

    p.websiteUrl = 'http://saerona-mp.com';
    p.priceInfo.standardizedPrices = [
        // 본관 - 신세계관(지하층A)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '신세계관 (지하층A)', unit: '천원', rows: [
                { name: '8단', price: 2000000, feeType: 'USAGE' },
                { name: '7단', price: 2700000, feeType: 'USAGE' },
                { name: '6단', price: 2900000, feeType: 'USAGE' },
                { name: '5단', price: 2900000, feeType: 'USAGE' },
                { name: '4단', price: 2900000, feeType: 'USAGE' },
                { name: '3단', price: 2700000, feeType: 'USAGE' },
                { name: '2단', price: 2500000, feeType: 'USAGE' },
                { name: '1단', price: 1500000, feeType: 'USAGE' },
            ]
        },
        // 본관 - 평화관(2층)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '평화관 (2층)', unit: '원', rows: [
                { name: '9단', price: 1700000, feeType: 'USAGE' },
                { name: '8단', price: 2600000, feeType: 'USAGE' },
                { name: '7단', price: 3100000, feeType: 'USAGE' },
                { name: '6단', price: 3500000, feeType: 'USAGE' },
                { name: '5단', price: 3500000, feeType: 'USAGE', isRepresentative: true },
                { name: '4단', price: 3500000, feeType: 'USAGE' },
                { name: '3단', price: 3100000, feeType: 'USAGE' },
                { name: '2단', price: 2600000, feeType: 'USAGE' },
                { name: '1단', price: 1700000, feeType: 'USAGE' },
            ]
        },
        // 본관 - 하늘1관(3층)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '하늘1관 (3층)', unit: '원', rows: [
                { name: '9단', price: 1900000, feeType: 'USAGE' },
                { name: '8단', price: 2700000, feeType: 'USAGE' },
                { name: '7단', price: 3300000, feeType: 'USAGE' },
                { name: '6단', price: 4000000, feeType: 'USAGE' },
                { name: '5단', price: 4000000, feeType: 'USAGE' },
                { name: '4단', price: 4000000, feeType: 'USAGE' },
                { name: '3단', price: 3300000, feeType: 'USAGE' },
                { name: '2단', price: 2700000, feeType: 'USAGE' },
                { name: '1단', price: 2000000, feeType: 'USAGE' },
            ]
        },
        // 본관 - 하늘2관(4층 고급실)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '하늘2관 (4층 고급실)', unit: '원', rows: [
                { name: '9단', price: 2000000, feeType: 'USAGE' },
                { name: '8단', price: 3000000, feeType: 'USAGE' },
                { name: '7단', price: 4000000, feeType: 'USAGE' },
                { name: '6단', price: 5500000, feeType: 'USAGE' },
                { name: '5단', price: 6000000, feeType: 'USAGE' },
                { name: '4단', price: 5500000, feeType: 'USAGE' },
                { name: '3단', price: 4000000, feeType: 'USAGE' },
                { name: '2단', price: 3000000, feeType: 'USAGE' },
                { name: '1단', price: 2000000, feeType: 'USAGE' },
            ]
        },
        // 본관 - 하늘2관(4층 고급실 정면)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '하늘2관 (4층 고급실 정면)', unit: '원', rows: [
                { name: '8단', price: 7000000, feeType: 'USAGE' },
                { name: '7단', price: 9000000, feeType: 'USAGE' },
                { name: '6단', price: 12000000, feeType: 'USAGE' },
                { name: '5단', price: 13000000, feeType: 'USAGE' },
                { name: '4단', price: 12000000, feeType: 'USAGE' },
                { name: '3단', price: 9000000, feeType: 'USAGE' },
                { name: '2단', price: 7000000, feeType: 'USAGE' },
                { name: '1단', price: 5000000, feeType: 'USAGE' },
            ]
        },
        // 본관 - 하늘1관(3층 특별실)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '하늘1관 (3층 특별실)', unit: '원', rows: [
                { name: '7단', price: 4000000, feeType: 'USAGE' },
                { name: '6단', price: 6000000, feeType: 'USAGE' },
                { name: '5단', price: 8000000, feeType: 'USAGE' },
                { name: '4단', price: 8000000, feeType: 'USAGE' },
                { name: '3단', price: 8000000, feeType: 'USAGE' },
                { name: '2단', price: 7000000, feeType: 'USAGE' },
                { name: '1단', price: 4000000, feeType: 'USAGE' },
            ]
        },
        // 본관 - 하늘2관(4층 특별실)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '하늘2관 (4층 특별실)', unit: '원', rows: [
                { name: '7단', price: 4500000, feeType: 'USAGE' },
                { name: '6단', price: 6500000, feeType: 'USAGE' },
                { name: '5단', price: 8500000, feeType: 'USAGE' },
                { name: '4단', price: 8500000, feeType: 'USAGE' },
                { name: '3단', price: 8500000, feeType: 'USAGE' },
                { name: '2단', price: 7500000, feeType: 'USAGE' },
                { name: '1단', price: 4500000, feeType: 'USAGE' },
            ]
        },
        // 본관 - 사랑관(1층 특별실)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '사랑관 (1층 특별실)', unit: '원', rows: [
                { name: '8단', price: 2600000, feeType: 'USAGE' },
                { name: '7단', price: 3500000, feeType: 'USAGE' },
                { name: '6단', price: 4000000, feeType: 'USAGE' },
                { name: '5단', price: 5500000, feeType: 'USAGE' },
                { name: '4단', price: 5500000, feeType: 'USAGE' },
                { name: '3단', price: 4000000, feeType: 'USAGE' },
                { name: '2단', price: 3500000, feeType: 'USAGE' },
                { name: '1단', price: 2400000, feeType: 'USAGE' },
            ]
        },
        // 본관 - 사랑관(1층 특별 아치단)
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '사랑관 (1층 특별 아치단)', unit: '원', rows: [
                { name: '6단', price: 24000000, feeType: 'USAGE' },
                { name: '5단', price: 21000000, feeType: 'USAGE' },
                { name: '4단', price: 21000000, feeType: 'USAGE' },
                { name: '3단', price: 18000000, feeType: 'USAGE' },
                { name: '2단', price: 15000000, feeType: 'USAGE' },
                { name: '1단', price: 10000000, feeType: 'USAGE' },
            ]
        },
        // 별관 - AR1
        {
            serviceType: 'BONGSAN', subType: '별관 봉안당', groupType: '별관 AR1', unit: '원', rows: [
                { name: '8단', price: 3000000, feeType: 'USAGE' },
                { name: '7단', price: 4000000, feeType: 'USAGE' },
                { name: '6단', price: 5000000, feeType: 'USAGE' },
                { name: '5단', price: 7000000, feeType: 'USAGE' },
                { name: '4단', price: 8000000, feeType: 'USAGE' },
                { name: '3단', price: 7000000, feeType: 'USAGE' },
                { name: '2단', price: 5000000, feeType: 'USAGE' },
                { name: '1단', price: 4000000, feeType: 'USAGE' },
            ]
        },
        // 별관 - AR2
        {
            serviceType: 'BONGSAN', subType: '별관 봉안당', groupType: '별관 AR2', unit: '원', rows: [
                { name: '8단', price: 4000000, feeType: 'USAGE' },
                { name: '7단', price: 5000000, feeType: 'USAGE' },
                { name: '6단', price: 6000000, feeType: 'USAGE' },
                { name: '5단', price: 8000000, feeType: 'USAGE' },
                { name: '4단', price: 9000000, feeType: 'USAGE' },
                { name: '3단', price: 8000000, feeType: 'USAGE' },
                { name: '2단', price: 6000000, feeType: 'USAGE' },
                { name: '1단', price: 5000000, feeType: 'USAGE' },
            ]
        },
        // 별관 - 3층 특별실
        {
            serviceType: 'BONGSAN', subType: '별관 봉안당', groupType: '별관 3층 특별실', unit: '원', rows: [
                { name: '8단', price: 6000000, feeType: 'USAGE' },
                { name: '7단', price: 6000000, feeType: 'USAGE' },
                { name: '6단', price: 9000000, feeType: 'USAGE' },
                { name: '5단', price: 11000000, feeType: 'USAGE' },
                { name: '4단', price: 14000000, feeType: 'USAGE' },
                { name: '3단', price: 14000000, feeType: 'USAGE' },
                { name: '2단', price: 9000000, feeType: 'USAGE' },
                { name: '1단', price: 7000000, feeType: 'USAGE' },
            ]
        },
        // 별관 - AR4
        {
            serviceType: 'BONGSAN', subType: '별관 봉안당', groupType: '별관 AR4', unit: '원', rows: [
                { name: '8단', price: 4000000, feeType: 'USAGE' },
                { name: '7단', price: 5000000, feeType: 'USAGE' },
                { name: '6단', price: 7000000, feeType: 'USAGE' },
                { name: '5단', price: 9000000, feeType: 'USAGE' },
                { name: '4단', price: 10000000, feeType: 'USAGE' },
                { name: '3단', price: 9000000, feeType: 'USAGE' },
                { name: '2단', price: 6000000, feeType: 'USAGE' },
                { name: '1단', price: 5000000, feeType: 'USAGE' },
            ]
        },
        // 관리비 - 본관 일반실
        {
            serviceType: 'BONGSAN', subType: '본관 봉안당', groupType: '관리비 (일반실)', unit: '원', rows: [
                { name: '개인단 (1년)', price: 50000, feeType: 'MAINTENANCE' },
                { name: '부부단 (1년)', price: 90000, feeType: 'MAINTENANCE' },
                { name: '개인단 (5년)', price: 250000, feeType: 'MAINTENANCE' },
                { name: '부부단 (5년)', price: 450000, feeType: 'MAINTENANCE' },
                { name: '개인단 (10년)', price: 500000, feeType: 'MAINTENANCE' },
                { name: '부부단 (10년)', price: 900000, feeType: 'MAINTENANCE' },
                { name: '개인단 (15년)', price: 750000, feeType: 'MAINTENANCE' },
                { name: '부부단 (15년)', price: 1350000, feeType: 'MAINTENANCE' },
            ]
        },
        // 관리비 - 고급·특별실
        {
            serviceType: 'BONGSAN', subType: '본관·별관', groupType: '관리비 (고급·특별실)', unit: '원', rows: [
                { name: '개인단 (1년)', price: 65000, feeType: 'MAINTENANCE' },
                { name: '부부단 (1년)', price: 120000, feeType: 'MAINTENANCE' },
                { name: '개인단 (5년)', price: 325000, feeType: 'MAINTENANCE' },
                { name: '부부단 (5년)', price: 600000, feeType: 'MAINTENANCE' },
                { name: '개인단 (10년)', price: 650000, feeType: 'MAINTENANCE' },
                { name: '부부단 (10년)', price: 1200000, feeType: 'MAINTENANCE' },
                { name: '개인단 (15년)', price: 975000, feeType: 'MAINTENANCE' },
                { name: '부부단 (15년)', price: 1800000, feeType: 'MAINTENANCE' },
            ]
        },
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅', p.id, p.name, '- 각 단 개별 가격으로 수정');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility').update({
        pricing: JSON.stringify(p.priceInfo),
        websiteUrl: p.websiteUrl
    }).eq('id', 'park-0694');
    console.log(error ? '❌ ' + error.message : '☁️ park-0694 Supabase 동기화 완료');
}
fix();
