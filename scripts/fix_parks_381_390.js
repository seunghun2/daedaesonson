const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 강화군 패턴: 381,383,386,388,389,390 ──
    for (const id of ['park-0381', 'park-0383', 'park-0386', 'park-0388', 'park-0389', 'park-0390']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '강화군민만 이용가능', isRepresentative: true },
                { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '강화군민만 이용가능' },
            ]
        }];
        console.log('✅', id, p.name, '→ 사용료/관리비 분리, LOCAL');
        changed.push(id);
    }

    // ── 나주 패턴: 382,387 ──
    for (const id of ['park-0382', 'park-0387']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        const row = p.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 나주시민, 사용기간: 15년, 사용료: 3.3m2당 1만원';
        row.residency = 'LOCAL';
        console.log('✅', id, p.name, '→ grade 보완, LOCAL');
        changed.push(id);
    }

    // ── 384: 구례군공설묘지 - grade 보완 ──
    const p384 = data.find(x => x.id === 'park-0384');
    if (p384) {
        const row = p384.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '1기당 10m2/15년';
        console.log('✅ 384 구례군공설묘지 grade 보완');
        changed.push('park-0384');
    }

    // ── 385: 구좌읍공설묘지 - EXTENSION→USAGE, grade, LOCAL ──
    const p385 = data.find(x => x.id === 'park-0385');
    if (p385) {
        const row = p385.priceInfo.standardizedPrices[0].rows[0];
        row.feeType = 'USAGE';
        row.grade = '이용자격: 제주도민, 사용기간: 15년, 3회 연장 가능';
        row.residency = 'LOCAL';
        console.log('✅ 385 구좌읍공설묘지 USAGE, grade, LOCAL');
        changed.push('park-0385');
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
    }
    console.log('✨ 381~390 DB 동기화 완료!');
}
fix();
