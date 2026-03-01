/**
 * park-0673~0676 아카이브 일괄 처리
 *
 * 673 오산시립쉼터공원 → 아카이브
 *   봉안시설 사용료+관리비, 개인단/부부단, 관내/관외, 15년간 기준
 *   기초생활수급자·국가유공자 면제
 *   개인 관내 500,000 / 관외 750,000
 *   부부 관내 700,000 / 관외 1,050,000
 *
 * 674 제천시영원한쉼터봉안당 → 아카이브
 *   개인 관내 160,000 (사용료10+관리비6) / 준관내 360,000 / 관외 460,000
 *   부부 관내 320,000 (사용료20+관리비12) / 준관내 720,000 / 관외 920,000
 *
 * 675 대전추모공원 영락원 → 아카이브
 *   봉인 관내 200,000 / 관외 400,000 (1구당, 15년기한)
 *   묘지(단장 재계약) 363,000 / 합장 544,500 (1구당, 15년)
 *   가족묘원(재계약) 550,000 / 관리비 516,000 (1기당, 5년단위)
 *
 * 676 무지개추모공원 봉안당(다래원) → 아카이브
 *   개인 1단 1,500,000 / 2·8단 2,000,000 / 2단 2,500,000 / 3·7단 3,000,000
 *   개인 4·6단 4,000,000 / 5단 4,500,000 (영구안치)
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

    // ===== 673 오산시립쉼터공원 =====
    const p673 = data.find(x => x.id === 'park-0673');
    if (p673) {
        p673.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '개인단 (15년)', unit: '원', rows: [
                    { name: '사용료+관리비', price: 500000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL' },
                    { name: '사용료+관리비', price: 750000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '부부단 (15년)', unit: '원', rows: [
                    { name: '사용료+관리비', price: 700000, feeType: 'USAGE', residency: 'LOCAL' },
                    { name: '사용료+관리비', price: 1050000, feeType: 'USAGE', residency: 'NON_LOCAL' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안시설', groupType: '감면 (기초생활수급자·국가유공자)', unit: '원', rows: [
                    { name: '개인단 관내', price: 0, feeType: 'USAGE', grade: '면제' },
                    { name: '부부단 관내', price: 0, feeType: 'USAGE', grade: '면제' },
                ]
            },
        ];
        updates.push({ id: 'park-0673', p: p673 });
        console.log('✅', p673.id, p673.name);
    }

    // ===== 674 제천시영원한쉼터봉안당 =====
    const p674 = data.find(x => x.id === 'park-0674');
    if (p674) {
        p674.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인', unit: '원', rows: [
                    { name: '관내', price: 160000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL', grade: '사용료 10만+관리비 6만' },
                    { name: '준관내', price: 360000, feeType: 'USAGE', grade: '충북도 관내, 충부내륙중심권광정합역 시·군 / 사용료 30만+관리비 6만' },
                    { name: '관외', price: 460000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '충북도 관외 / 사용료 40만+관리비 6만' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '부부', unit: '원', rows: [
                    { name: '관내', price: 320000, feeType: 'USAGE', residency: 'LOCAL', grade: '사용료 20만+관리비 12만' },
                    { name: '준관내', price: 720000, feeType: 'USAGE', grade: '사용료 60만+관리비 12만' },
                    { name: '관외', price: 920000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '사용료 80만+관리비 12만' },
                ]
            },
        ];
        updates.push({ id: 'park-0674', p: p674 });
        console.log('✅', p674.id, p674.name);
    }

    // ===== 675 대전추모공원 영락원 =====
    const p675 = data.find(x => x.id === 'park-0675');
    if (p675) {
        p675.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안', groupType: '1구당', unit: '원', rows: [
                    { name: '관내', price: 200000, feeType: 'USAGE', isRepresentative: true, residency: 'LOCAL', grade: '15년 기한' },
                    { name: '관외', price: 400000, feeType: 'USAGE', residency: 'NON_LOCAL', grade: '15년 기한' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '묘지 (재계약)', groupType: '1구당', unit: '원', rows: [
                    { name: '단장', price: 363000, feeType: 'USAGE', grade: '15년 기한' },
                    { name: '합장', price: 544500, feeType: 'USAGE', grade: '15년 기한' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '가족묘원 (재계약)', groupType: '1기당', unit: '원', rows: [
                    { name: '사용료', price: 550000, feeType: 'USAGE', grade: '15년 기한' },
                    { name: '관리비', price: 516000, feeType: 'MAINTENANCE', grade: '5년 단위' },
                ]
            },
        ];
        updates.push({ id: 'park-0675', p: p675 });
        console.log('✅', p675.id, p675.name);
    }

    // ===== 676 무지개추모공원 봉안당(다래원) =====
    const p676 = data.find(x => x.id === 'park-0676');
    if (p676) {
        p676.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당', groupType: '개인 (영구안치)', unit: '원', rows: [
                    { name: '1단', price: 1500000, feeType: 'USAGE' },
                    { name: '2·8단', price: 2000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '2단', price: 2500000, feeType: 'USAGE' },
                    { name: '3·7단', price: 3000000, feeType: 'USAGE' },
                    { name: '4·6단', price: 4000000, feeType: 'USAGE' },
                    { name: '5단', price: 4500000, feeType: 'USAGE' },
                ]
            },
        ];
        updates.push({ id: 'park-0676', p: p676 });
        console.log('✅', p676.id, p676.name);
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
