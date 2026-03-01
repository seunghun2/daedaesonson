/**
 * park-0631 (재)여주세종추모공원 봉안당 → groupType 적용
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

    const p = data.find(x => x.id === 'park-0631');
    if (!p) { console.log('NOT FOUND'); return; }

    p.priceInfo.standardizedPrices = [
        // 봉안당 - 개인단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인단', unit: '원',
            rows: [
                { name: '사용료', price: 2000000, feeType: 'USAGE', isRepresentative: true },
                { name: '관리비', price: 50000, feeType: 'MAINTENANCE', grade: '1년, 5년 선납' },
            ]
        },
        // 봉안당 - 부부단
        {
            serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부단', unit: '원',
            rows: [
                { name: '사용료', price: 4000000, feeType: 'USAGE' },
                { name: '관리비', price: 70000, feeType: 'MAINTENANCE', grade: '1년, 5년 선납' },
            ]
        },
        // 자연장 (개인만)
        {
            serviceType: 'NATURAL_BURIAL', subType: '자연장', unit: '원',
            rows: [
                { name: '개인단', price: 2000000, feeType: 'USAGE' },
            ]
        },
        // 가족납골 (자연장)
        {
            serviceType: 'NATURAL_BURIAL', subType: '가족납골 (자연장)', unit: '원',
            rows: [
                { name: '기당', price: 1000000, feeType: 'USAGE' },
            ]
        },
        // 납골묘(명당) - 개인
        {
            serviceType: 'BONGSAN', subType: '납골묘 (명당)', groupType: '개인', unit: '원',
            rows: [
                { name: '사용료', price: 3000000, feeType: 'USAGE' },
            ]
        },
        // 납골묘(명당) - 부부
        {
            serviceType: 'BONGSAN', subType: '납골묘 (명당)', groupType: '부부', unit: '원',
            rows: [
                { name: '사용료', price: 5000000, feeType: 'USAGE' },
            ]
        },
    ];

    console.log('✅', p.id, p.name);

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase.from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0631');
    if (error) console.log('❌', error.message);
    else console.log('☁️ Supabase 동기화 완료');
}

fix();
