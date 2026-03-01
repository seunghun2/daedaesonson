/**
 * park-0687~0689 아카이브 일괄 처리
 *
 * 687 영광군 공설추모공원 봉안당 → 아카이브
 *   관내 1기 15년: 500,000 / 관외: 1,500,000
 *   관내 2기 15년: 1,000,000 / 관외: 3,000,000
 *   관내 1기 5년: 100,000 / 관외: 200,000 (관리비 갱신)
 *
 * 688 갑곶순교성지 천국의 문 → 아카이브
 *   봉안당 사용료(20년): 5,000,000 / 4,000,000 / 3,000,000 / 10,000,000
 *   관리비(20년 선납): 1,200,000 (1년 60,000)
 *
 * 689 천주교 광주교구 담양공원묘원 → 아카이브
 *   2-7단: 2,000,000 (30년)
 *   1단: 1,500,000 (30년)
 *   1단(대형): 5,000,000 (30년)
 *   2단,7단: 6,000,000 (30년)
 *   3단-6단: 7,000,000 (30년)
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
    const updates = [];

    // ===== 687 영광군 공설추모공원 봉안당 =====
    const p687 = data.find(x => x.id === 'park-0687');
    if (p687) {
        p687.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '1기 (15년)', unit: '원', rows: [
                    { name: '관내', price: 500000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '관외', price: 1500000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '2기 (15년)', unit: '원', rows: [
                    { name: '관내', price: 1000000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '관외', price: 3000000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관리비 갱신 1기 (5년)', unit: '원', rows: [
                    { name: '관내', price: 100000, feeType: 'MAINTENANCE', residency: 'LOCAL' },
                    { name: '관외', price: 200000, feeType: 'MAINTENANCE', residency: 'NON_LOCAL' },
                ]
            },
        ];
        updates.push({ id: 'park-0687', p: p687 });
        console.log('✅', p687.id, p687.name);
    }

    // ===== 688 갑곶순교성지 천국의 문 =====
    const p688 = data.find(x => x.id === 'park-0688');
    if (p688) {
        p688.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '사용료 (20년)', unit: '원', rows: [
                    { name: '1등급', price: 10000000, feeType: 'USAGE' },
                    { name: '2등급', price: 5000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '3등급', price: 4000000, feeType: 'USAGE' },
                    { name: '4등급', price: 3000000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '관리비 (20년 선납)', unit: '원', rows: [
                    { name: '관리비 (1년 60,000 × 20년)', price: 1200000, feeType: 'MAINTENANCE' },
                ]
            },
        ];
        updates.push({ id: 'park-0688', p: p688 });
        console.log('✅', p688.id, p688.name);
    }

    // ===== 689 천주교 광주교구 담양공원묘원 =====
    const p689 = data.find(x => x.id === 'park-0689');
    if (p689) {
        p689.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '일반형 (30년)', unit: '원', rows: [
                    { name: '2~7단', price: 2000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '1단', price: 1500000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '대형 (30년)', unit: '원', rows: [
                    { name: '1단', price: 5000000, feeType: 'USAGE' },
                    { name: '2단·7단', price: 6000000, feeType: 'USAGE' },
                    { name: '3단~6단', price: 7000000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0689', p: p689 });
        console.log('✅', p689.id, p689.name);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    for (const u of updates) {
        const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(u.p.priceInfo) }).eq('id', u.id);
        if (error) console.log('❌', u.id, error.message);
        else console.log('☁️', u.id, 'Supabase 동기화 완료');
    }
}
fix();
