const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 464: (재)신세계공원묘원 - feeType 수정 ──
    const p464 = data.find(x => x.id === 'park-0464');
    if (p464) {
        p464.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘', unit: '원',
                rows: [
                    { name: '묘지 사용료', price: 1000000, feeType: 'USAGE', grade: '평당가(3.3㎡/평)', isRepresentative: true },
                    { name: '관리비', price: 14000, feeType: 'MAINTENANCE', grade: '년/평당가(3.3㎡/평)' },
                ]
            },
            {
                serviceType: 'BURIAL', subType: '평장묘', unit: '원',
                rows: [
                    { name: '평장묘 (1구)', price: 4000000, feeType: 'USAGE', grade: '시설비 및 사용료 (관리비·각자비 별도)', isRepresentative: true },
                    { name: '평장묘 (2~4구)', price: 8700000, feeType: 'USAGE', grade: '시설비 및 사용료 (관리비·봉안비·각자비 별도)' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안묘', unit: '원',
                rows: [
                    { name: '봉안묘 (부부)', price: 10000000, feeType: 'USAGE', grade: '시설비 및 사용료 (관리비·봉안비·각자비 별도)', isRepresentative: true },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '수목장', unit: '원',
                rows: [
                    { name: '수목장 (부부목 / 1~2위)', price: 4750000, feeType: 'USAGE', grade: '사용료 및 관리비 (석물·봉안비·각자비 별도)', isRepresentative: true },
                    { name: '수목장 (1~4위)', price: 9400000, feeType: 'USAGE', grade: '사용료 및 관리비 (석물·봉안비·각자비 별도)' },
                ]
            }
        ];
        console.log('✅ 464 (재)신세계공원묘원 → feeType USAGE로 수정, 구조 정리');
        changed.push('park-0464');
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
    console.log('✨ 461~470 DB 동기화 완료!');
}
fix();
