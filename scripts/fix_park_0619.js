/**
 * park-0619 흥륜사정토원 가격 데이터 세팅 (v4)
 * 미타실(1관,2관), 준특별실(1관,2관) 하나의 아코디언으로 통합
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

    const p = data.find(x => x.id === 'park-0619');
    if (!p) { console.log('NOT FOUND: park-0619'); return; }

    p.websiteUrl = 'https://www.jungtowon.co.kr';
    if (!p.priceInfo) p.priceInfo = {};

    p.priceInfo.standardizedPrices = [
        // ========== 연화실 ==========
        {
            serviceType: 'BONGSAN', subType: '연화실', unit: '원',
            groupType: '기본단',
            rows: [
                { name: '1단', price: 3000000, feeType: 'USAGE', isRepresentative: true },
                { name: '4단', price: 5000000, feeType: 'USAGE' },
                { name: '5단', price: 5000000, feeType: 'USAGE' },
                { name: '6단', price: 5000000, feeType: 'USAGE' },
                { name: '7단', price: 4000000, feeType: 'USAGE' },
                { name: '8단', price: 3000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '연화실', unit: '원',
            groupType: '확장단',
            rows: [
                { name: '4단', price: 9000000, feeType: 'USAGE' },
                { name: '5단', price: 9000000, feeType: 'USAGE' },
                { name: '6단', price: 9000000, feeType: 'USAGE' },
                { name: '7단', price: 7000000, feeType: 'USAGE' },
                { name: '8단', price: 5000000, feeType: 'USAGE' },
            ]
        },

        // ========== 미타실 (1관+2관 통합) ==========
        {
            serviceType: 'BONGSAN', subType: '미타실', unit: '원',
            groupType: '1관(기본단)',
            rows: [
                { name: '1단', price: 6500000, feeType: 'USAGE' },
                { name: '7단', price: 7500000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '미타실', unit: '원',
            groupType: '1관(확장단)',
            rows: [
                { name: '1단', price: 11000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '미타실', unit: '원',
            groupType: '2관(기본단)',
            rows: [
                { name: '1단', price: 6000000, feeType: 'USAGE' },
                { name: '7단', price: 7000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '미타실', unit: '원',
            groupType: '2관(확장단)',
            rows: [
                { name: '1단', price: 10000000, feeType: 'USAGE' },
                { name: '7단', price: 12000000, feeType: 'USAGE' },
            ]
        },

        // ========== 준특별실 (1관+2관 통합) ==========
        {
            serviceType: 'BONGSAN', subType: '준특별실', unit: '원',
            groupType: '1관(기본단)',
            rows: [
                { name: '1단', price: 9000000, feeType: 'USAGE' },
                { name: '7단', price: 10000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '준특별실', unit: '원',
            groupType: '1관(확장단)',
            rows: [
                { name: '7단', price: 18000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '준특별실', unit: '원',
            groupType: '2관(기본단)',
            rows: [
                { name: '1단', price: 8000000, feeType: 'USAGE' },
                { name: '2단', price: 9000000, feeType: 'USAGE' },
                { name: '6단', price: 10000000, feeType: 'USAGE' },
                { name: '7단', price: 9000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '준특별실', unit: '원',
            groupType: '2관(확장단)',
            rows: [
                { name: '1단', price: 14000000, feeType: 'USAGE' },
                { name: '7단', price: 16000000, feeType: 'USAGE' },
            ]
        },

        // ========== 반야실 ==========
        {
            serviceType: 'BONGSAN', subType: '반야실', unit: '원',
            groupType: '기본단',
            rows: [
                { name: '1단', price: 6000000, feeType: 'USAGE' },
                { name: '2단', price: 7000000, feeType: 'USAGE' },
                { name: '3단', price: 9000000, feeType: 'USAGE' },
                { name: '4단', price: 11000000, feeType: 'USAGE' },
                { name: '5단', price: 11000000, feeType: 'USAGE' },
                { name: '6단', price: 9000000, feeType: 'USAGE' },
                { name: '7단', price: 7000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '반야실', unit: '원',
            groupType: '확장단',
            rows: [
                { name: '1단', price: 12000000, feeType: 'USAGE' },
                { name: '2단', price: 15000000, feeType: 'USAGE' },
                { name: '3단', price: 19000000, feeType: 'USAGE' },
                { name: '4단', price: 22000000, feeType: 'USAGE' },
                { name: '5단', price: 22000000, feeType: 'USAGE' },
                { name: '6단', price: 18000000, feeType: 'USAGE' },
                { name: '7단', price: 14000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '반야실', unit: '원',
            groupType: '특별단',
            rows: [
                { name: '1단', price: 30000000, feeType: 'USAGE' },
                { name: '2단', price: 40000000, feeType: 'USAGE' },
                { name: '3단', price: 45000000, feeType: 'USAGE' },
                { name: '4단', price: 35000000, feeType: 'USAGE' },
            ]
        },

        // ========== 마하실 ==========
        {
            serviceType: 'BONGSAN', subType: '마하실', unit: '원',
            groupType: '기본단',
            rows: [
                { name: '1단', price: 8000000, feeType: 'USAGE' },
                { name: '2단', price: 9000000, feeType: 'USAGE' },
                { name: '3단', price: 11000000, feeType: 'USAGE' },
                { name: '4단', price: 13000000, feeType: 'USAGE' },
                { name: '5단', price: 13000000, feeType: 'USAGE' },
                { name: '6단', price: 11000000, feeType: 'USAGE' },
                { name: '7단', price: 9000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '마하실', unit: '원',
            groupType: '확장단',
            rows: [
                { name: '1단', price: 15000000, feeType: 'USAGE' },
                { name: '2단', price: 18000000, feeType: 'USAGE' },
                { name: '3단', price: 22000000, feeType: 'USAGE' },
                { name: '4단', price: 25000000, feeType: 'USAGE' },
                { name: '5단', price: 25000000, feeType: 'USAGE' },
                { name: '6단', price: 21000000, feeType: 'USAGE' },
                { name: '7단', price: 17000000, feeType: 'USAGE' },
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '마하실', unit: '원',
            groupType: '특별단',
            rows: [
                { name: '1단', price: 35000000, feeType: 'USAGE' },
                { name: '2단', price: 45000000, feeType: 'USAGE' },
                { name: '3단', price: 50000000, feeType: 'USAGE' },
                { name: '4단', price: 40000000, feeType: 'USAGE' },
            ]
        },
    ];

    console.log('✅ park-0619 흥륜사정토원 v4 세팅 완료');
    p.priceInfo.standardizedPrices.forEach(g => {
        console.log('   [' + g.subType + '] ' + g.groupType + ' (' + g.rows.length + '개)');
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    const f = data.find(d => d.id === 'park-0619');
    const { error } = await supabase
        .from('Facility')
        .update({
            pricing: JSON.stringify(f.priceInfo),
            websiteUrl: f.websiteUrl
        })
        .eq('id', 'park-0619');

    if (error) console.log('❌ Supabase 실패:', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
