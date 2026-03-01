/**
 * park-0614 일산푸른솔추모공원 — 공식 홈페이지 기준 업데이트
 * http://www.xn--6w2b15kutaz6o56r.com/intro/use.asp
 *
 * 1관 2층: 일반실(국화/매화/동백/수련) 10단, 고급실(민들레/진달래 등) 9단
 * 1관 3층: 일반실 10단, 고급실 9단  (은난초/금낭화/백일홍은 고급실과 동일가)
 * VIP실: 7단
 * 2관: 고급1호실 6단
 * 관리비: 일반/고급 30/60만(5년), VIP 40/80만(5년)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

const W = 10000; // 만원

async function fix() {
    const fp = path.join(__dirname, '..', 'data', 'facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const p = data.find(x => x.id === 'park-0614');
    if (!p) { console.log('NOT FOUND'); return; }
    if (!p.priceInfo) p.priceInfo = {};

    p.websiteUrl = 'http://www.xn--6w2b15kutaz6o56r.com/intro/use.asp';

    p.priceInfo.standardizedPrices = [
        // ===== 1관 2층 일반실 (국화/매화/동백/수련) =====
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '1관 2층 일반실',
            rows: [
                { name: '10단', price: 150 * W, feeType: 'USAGE', isRepresentative: true },
                { name: '9단', price: 200 * W, feeType: 'USAGE' },
                { name: '8단', price: 250 * W, feeType: 'USAGE' },
                { name: '7단', price: 300 * W, feeType: 'USAGE' },
                { name: '6단', price: 400 * W, feeType: 'USAGE' },
                { name: '5단', price: 450 * W, feeType: 'USAGE' },
                { name: '4단', price: 450 * W, feeType: 'USAGE' },
                { name: '3단', price: 400 * W, feeType: 'USAGE' },
                { name: '2단', price: 350 * W, feeType: 'USAGE' },
                { name: '1단', price: 250 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '1관 2층 일반실',
            rows: [
                { name: '10단', price: 300 * W, feeType: 'USAGE' },
                { name: '9단', price: 400 * W, feeType: 'USAGE' },
                { name: '8단', price: 500 * W, feeType: 'USAGE' },
                { name: '7단', price: 600 * W, feeType: 'USAGE' },
                { name: '6단', price: 800 * W, feeType: 'USAGE' },
                { name: '5단', price: 900 * W, feeType: 'USAGE' },
                { name: '4단', price: 900 * W, feeType: 'USAGE' },
                { name: '3단', price: 800 * W, feeType: 'USAGE' },
                { name: '2단', price: 700 * W, feeType: 'USAGE' },
                { name: '1단', price: 500 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 60 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        // ===== 1관 2층 고급실 (민들레/진달래/은난초/금낭화/백일홍) =====
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '1관 2층 고급실',
            rows: [
                { name: '9단', price: 350 * W, feeType: 'USAGE' },
                { name: '8단', price: 400 * W, feeType: 'USAGE' },
                { name: '7단', price: 500 * W, feeType: 'USAGE' },
                { name: '6단', price: 600 * W, feeType: 'USAGE' },
                { name: '5단', price: 700 * W, feeType: 'USAGE' },
                { name: '4단', price: 650 * W, feeType: 'USAGE' },
                { name: '3단', price: 600 * W, feeType: 'USAGE' },
                { name: '2단', price: 500 * W, feeType: 'USAGE' },
                { name: '1단', price: 400 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '1관 2층 고급실',
            rows: [
                { name: '9단', price: 700 * W, feeType: 'USAGE' },
                { name: '8단', price: 800 * W, feeType: 'USAGE' },
                { name: '7단', price: 1000 * W, feeType: 'USAGE' },
                { name: '6단', price: 1200 * W, feeType: 'USAGE' },
                { name: '5단', price: 1400 * W, feeType: 'USAGE' },
                { name: '4단', price: 1300 * W, feeType: 'USAGE' },
                { name: '3단', price: 1200 * W, feeType: 'USAGE' },
                { name: '2단', price: 1000 * W, feeType: 'USAGE' },
                { name: '1단', price: 800 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 60 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        // ===== 1관 3층 일반실 =====
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '1관 3층 일반실',
            rows: [
                { name: '10단', price: 200 * W, feeType: 'USAGE' },
                { name: '9단', price: 250 * W, feeType: 'USAGE' },
                { name: '8단', price: 300 * W, feeType: 'USAGE' },
                { name: '7단', price: 350 * W, feeType: 'USAGE' },
                { name: '6단', price: 500 * W, feeType: 'USAGE' },
                { name: '5단', price: 650 * W, feeType: 'USAGE' },
                { name: '4단', price: 600 * W, feeType: 'USAGE' },
                { name: '3단', price: 500 * W, feeType: 'USAGE' },
                { name: '2단', price: 400 * W, feeType: 'USAGE' },
                { name: '1단', price: 300 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '1관 3층 일반실',
            rows: [
                { name: '10단', price: 400 * W, feeType: 'USAGE' },
                { name: '9단', price: 500 * W, feeType: 'USAGE' },
                { name: '8단', price: 600 * W, feeType: 'USAGE' },
                { name: '7단', price: 700 * W, feeType: 'USAGE' },
                { name: '6단', price: 1000 * W, feeType: 'USAGE' },
                { name: '5단', price: 1300 * W, feeType: 'USAGE' },
                { name: '4단', price: 1200 * W, feeType: 'USAGE' },
                { name: '3단', price: 1000 * W, feeType: 'USAGE' },
                { name: '2단', price: 800 * W, feeType: 'USAGE' },
                { name: '1단', price: 600 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 60 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        // ===== 1관 3층 고급실 =====
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '1관 3층 고급실',
            rows: [
                { name: '9단', price: 350 * W, feeType: 'USAGE' },
                { name: '8단', price: 400 * W, feeType: 'USAGE' },
                { name: '7단', price: 500 * W, feeType: 'USAGE' },
                { name: '6단', price: 700 * W, feeType: 'USAGE' },
                { name: '5단', price: 900 * W, feeType: 'USAGE' },
                { name: '4단', price: 850 * W, feeType: 'USAGE' },
                { name: '3단', price: 750 * W, feeType: 'USAGE' },
                { name: '2단', price: 600 * W, feeType: 'USAGE' },
                { name: '1단', price: 450 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '1관 3층 고급실',
            rows: [
                { name: '9단', price: 700 * W, feeType: 'USAGE' },
                { name: '8단', price: 800 * W, feeType: 'USAGE' },
                { name: '7단', price: 1000 * W, feeType: 'USAGE' },
                { name: '6단', price: 1400 * W, feeType: 'USAGE' },
                { name: '5단', price: 1800 * W, feeType: 'USAGE' },
                { name: '4단', price: 1700 * W, feeType: 'USAGE' },
                { name: '3단', price: 1500 * W, feeType: 'USAGE' },
                { name: '2단', price: 1200 * W, feeType: 'USAGE' },
                { name: '1단', price: 900 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 60 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        // ===== VIP실 =====
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: 'VIP실',
            rows: [
                { name: '7단', price: 800 * W, feeType: 'USAGE' },
                { name: '6단', price: 1100 * W, feeType: 'USAGE' },
                { name: '5단', price: 1200 * W, feeType: 'USAGE' },
                { name: '4단', price: 1200 * W, feeType: 'USAGE' },
                { name: '3단', price: 1000 * W, feeType: 'USAGE' },
                { name: '2단', price: 900 * W, feeType: 'USAGE' },
                { name: '1단', price: 650 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 40 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: 'VIP실',
            rows: [
                { name: '7단', price: 1600 * W, feeType: 'USAGE' },
                { name: '6단', price: 2200 * W, feeType: 'USAGE' },
                { name: '5단', price: 2400 * W, feeType: 'USAGE' },
                { name: '4단', price: 2400 * W, feeType: 'USAGE' },
                { name: '3단', price: 2000 * W, feeType: 'USAGE' },
                { name: '2단', price: 1800 * W, feeType: 'USAGE' },
                { name: '1단', price: 1300 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 80 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        // ===== 2관 고급1호실 =====
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', groupType: '2관 고급실',
            rows: [
                { name: '6단', price: 1100 * W, feeType: 'USAGE' },
                { name: '5단', price: 1200 * W, feeType: 'USAGE' },
                { name: '4단', price: 1200 * W, feeType: 'USAGE' },
                { name: '3단', price: 1100 * W, feeType: 'USAGE' },
                { name: '2단', price: 900 * W, feeType: 'USAGE' },
                { name: '1단', price: 700 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 30 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', groupType: '2관 고급실',
            rows: [
                { name: '6단', price: 2200 * W, feeType: 'USAGE' },
                { name: '5단', price: 2400 * W, feeType: 'USAGE' },
                { name: '4단', price: 2400 * W, feeType: 'USAGE' },
                { name: '3단', price: 2200 * W, feeType: 'USAGE' },
                { name: '2단', price: 1800 * W, feeType: 'USAGE' },
                { name: '1단', price: 1400 * W, feeType: 'USAGE' },
                { name: '관리비(5년)', price: 60 * W, feeType: 'MAINTENANCE', grade: '5년 선납' },
            ]
        },
    ];

    p.priceInfo.representativePrice = 1500000;

    console.log('✅ park-0614 일산푸른솔추모공원 → 홈페이지 기준 전면 업데이트');
    console.log('   1관 2층: 일반실(10단) + 고급실(9단)');
    console.log('   1관 3층: 일반실(10단) + 고급실(9단)');
    console.log('   VIP실: 7단');
    console.log('   2관: 고급실 6단');

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ JSON 저장');

    // Supabase 동기화
    if (!SUPABASE_KEY) { console.log('⚠️ KEY 없음'); return; }
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { error } = await supabase.from('Facility')
        .update({
            pricing: JSON.stringify(p.priceInfo),
            websiteUrl: p.websiteUrl,
        })
        .eq('id', 'park-0614');
    console.log(error ? '❌ ' + error.message : '✅ DB 동기화 완료');
}
fix().catch(console.error);
