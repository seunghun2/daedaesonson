/**
 * park-0630 (재)서현추모공원 → VIP도 C/W/S groupType 분리
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function makeRows(prices, isRepFirst) {
    return prices.map((p, i) => ({
        name: `${1009 - i}단`,
        price: p * 10000,
        feeType: 'USAGE',
        ...(isRepFirst && i === 0 ? { isRepresentative: true } : {}),
    }));
}

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    const p = data.find(x => x.id === 'park-0630');
    if (!p) { console.log('NOT FOUND'); return; }

    p.websiteUrl = 'https://seohyunpark.com';

    const mgmt = { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '5년, 1위 기준' };
    const mgmtVip = { name: '관리비', price: 400000, feeType: 'MAINTENANCE', grade: '5년, 1위 기준' };

    p.priceInfo.standardizedPrices = [
        // 서관 일반실
        {
            serviceType: 'BONGSAN', subType: '서관 일반실', groupType: '개인단', unit: '원',
            rows: [...makeRows([200, 300, 450, 550, 600, 550, 500, 400, 300], true), mgmt]
        },
        {
            serviceType: 'BONGSAN', subType: '서관 일반실', groupType: '부부단', unit: '원',
            rows: [...makeRows([400, 600, 900, 1100, 1200, 1100, 1000, 800, 600], false), mgmt]
        },
        // 서관 고급실
        {
            serviceType: 'BONGSAN', subType: '서관 고급실', groupType: '개인단', unit: '원',
            rows: [...makeRows([200, 300, 500, 650, 700, 650, 600, 400, 300], false), mgmt]
        },
        {
            serviceType: 'BONGSAN', subType: '서관 고급실', groupType: '부부단', unit: '원',
            rows: [...makeRows([400, 600, 1000, 1300, 1400, 1300, 1200, 800, 600], false), mgmt]
        },
        // 동관 일반실
        {
            serviceType: 'BONGSAN', subType: '동관 일반실', groupType: '개인단', unit: '원',
            rows: [...makeRows([250, 350, 500, 550, 600, 550, 500, 400, 300], false), mgmt]
        },
        {
            serviceType: 'BONGSAN', subType: '동관 일반실', groupType: '부부단', unit: '원',
            rows: [...makeRows([500, 700, 1000, 1100, 1200, 1100, 1000, 800, 600], false), mgmt]
        },
        // 동관 고급실
        {
            serviceType: 'BONGSAN', subType: '동관 고급실', groupType: '개인단', unit: '원',
            rows: [...makeRows([300, 400, 600, 650, 700, 650, 600, 450, 350], false), mgmt]
        },
        {
            serviceType: 'BONGSAN', subType: '동관 고급실', groupType: '부부단', unit: '원',
            rows: [...makeRows([600, 800, 1200, 1300, 1400, 1300, 1200, 900, 700], false), mgmt]
        },
        // VIP(명당) - C
        {
            serviceType: 'BONGSAN', subType: 'VIP (명당)', groupType: 'C', unit: '원',
            rows: [
                { name: '3단', price: 40000000, feeType: 'USAGE' },
                { name: '2단', price: 35000000, feeType: 'USAGE' },
                { name: '1단', price: 30000000, feeType: 'USAGE' },
                mgmtVip,
            ]
        },
        // VIP(명당) - W
        {
            serviceType: 'BONGSAN', subType: 'VIP (명당)', groupType: 'W', unit: '원',
            rows: [
                { name: '6단', price: 30000000, feeType: 'USAGE' },
                { name: '5단', price: 35000000, feeType: 'USAGE' },
                { name: '4단', price: 40000000, feeType: 'USAGE' },
                { name: '3단', price: 38000000, feeType: 'USAGE' },
                { name: '2단', price: 35000000, feeType: 'USAGE' },
                { name: '1단', price: 28000000, feeType: 'USAGE' },
                mgmtVip,
            ]
        },
        // VIP(명당) - S
        {
            serviceType: 'BONGSAN', subType: 'VIP (명당)', groupType: 'S', unit: '원',
            rows: [
                { name: '7단', price: 25000000, feeType: 'USAGE' },
                { name: '6단', price: 35000000, feeType: 'USAGE' },
                { name: '5단', price: 40000000, feeType: 'USAGE' },
                { name: '4단', price: 38000000, feeType: 'USAGE' },
                { name: '3단', price: 35000000, feeType: 'USAGE' },
                { name: '2단', price: 30000000, feeType: 'USAGE' },
                { name: '1단', price: 25000000, feeType: 'USAGE' },
                mgmtVip,
            ]
        },
    ];

    console.log('✅', p.id, p.name);
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo), websiteUrl: p.websiteUrl })
        .eq('id', 'park-0630');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
