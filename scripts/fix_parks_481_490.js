const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 488: 광양시립영세공원 묘지 - EXTENSION→USAGE, STONE→별도 아코디언 ──
    const p488 = data.find(x => x.id === 'park-0488');
    if (p488) {
        p488.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '단장형', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 340000, feeType: 'USAGE', grade: '3회 연장 가능', isRepresentative: true, residency: 'LOCAL', groupType: '관내 (사망일 1개월 전 거주)' },
                    { name: '묘지 관리비', price: 180000, feeType: 'MAINTENANCE', grade: '3회 연장 가능', residency: 'LOCAL', groupType: '관내 (사망일 1개월 전 거주)' },
                    { name: '인건비', price: 211000, feeType: 'USAGE', residency: 'LOCAL', groupType: '관내 (사망일 1개월 전 거주)' },
                    { name: '잔디', price: 20000, feeType: 'USAGE', residency: 'LOCAL', groupType: '관내 (사망일 1개월 전 거주)' },
                    { name: '묘지 사용료', price: 600000, feeType: 'USAGE', grade: '3회 연장 가능', residency: 'NON_LOCAL', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '합장형', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 555000, feeType: 'USAGE', grade: '3회 연장 가능', isRepresentative: true, residency: 'LOCAL', groupType: '관내 (사망일 1개월 전 거주)' },
                    { name: '묘지 관리비', price: 225000, feeType: 'MAINTENANCE', grade: '3회 연장 가능', residency: 'LOCAL', groupType: '관내 (사망일 1개월 전 거주)' },
                    { name: '인건비', price: 282000, feeType: 'USAGE', residency: 'LOCAL', groupType: '관내 (사망일 1개월 전 거주)' },
                    { name: '잔디', price: 26000, feeType: 'USAGE', residency: 'LOCAL', groupType: '관내 (사망일 1개월 전 거주)' },
                    { name: '묘지 사용료', price: 789000, feeType: 'USAGE', grade: '3회 연장 가능', residency: 'NON_LOCAL', groupType: '관외 (등록기준지 광양 또는 직계존비속 거주)' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '석물', unit: '원',
                rows: [
                    { name: '단장 석물비', price: 305000, feeType: 'USAGE' },
                    { name: '단장 비석글씨', price: 70000, feeType: 'USAGE' },
                    { name: '합장 석물비', price: 330000, feeType: 'USAGE' },
                    { name: '합장 비석글씨', price: 70000, feeType: 'USAGE' },
                ]
            },
            {
                serviceType: 'OTHER', subType: '무연고', unit: '원',
                rows: [
                    { name: '사용료', price: 100000, feeType: 'USAGE', grade: '연장 불가능', isRepresentative: true },
                    { name: '관리비', price: 120000, feeType: 'MAINTENANCE', grade: '연장 불가능' },
                ]
            }
        ];
        console.log('✅ 488 광양시립영세공원 → EXTENSION→USAGE, STONE→별도 석물 아코디언');
        changed.push('park-0488');
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // DB 동기화
    for (const id of changed) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('✅ DB 동기화:', id);
    }
    console.log('✨ 완료!');
}
fix();
