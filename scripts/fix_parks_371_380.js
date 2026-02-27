const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 강화군 패턴: 373,374,376,377,378,380 ──
    for (const id of ['park-0373', 'park-0374', 'park-0376', 'park-0377', 'park-0378', 'park-0380']) {
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

    // ── 371: 부활동산종교재단법인 - 나주시민 grade 추가 ──
    const p371 = data.find(x => x.id === 'park-0371');
    if (p371) {
        const row = p371.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 나주시민, 사용기간: 15년, 사용료: 3.3m2당 1만원';
        row.residency = 'LOCAL';
        console.log('✅ 371 부활동산종교재단법인 grade, LOCAL');
        changed.push('park-0371');
    }

    // ── 372: 북면공설묘지 - 사용료/관리비 분리 ──
    const p372 = data.find(x => x.id === 'park-0372');
    if (p372) {
        p372.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 125000, feeType: 'USAGE', grade: '1기당', isRepresentative: true },
                { name: '관리비', price: 80000, feeType: 'MAINTENANCE', grade: '연간' },
            ]
        }];
        console.log('✅ 372 북면공설묘지 사용료/관리비 분리');
        changed.push('park-0372');
    }

    // ── 375: 산포면공설묘지 - 나주 grade 보완, LOCAL ──
    const p375 = data.find(x => x.id === 'park-0375');
    if (p375) {
        const row = p375.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 나주시민, 사용기간: 15년, 사용료: 3.3m2당 1만원';
        row.residency = 'LOCAL';
        console.log('✅ 375 산포면공설묘지 grade, LOCAL');
        changed.push('park-0375');
    }

    // ── 379: 가평읍공설묘지 - 사용료/관리비 분리 ──
    const p379 = data.find(x => x.id === 'park-0379');
    if (p379) {
        p379.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 125000, feeType: 'USAGE', grade: '1기당', isRepresentative: true },
                { name: '관리비', price: 80000, feeType: 'MAINTENANCE', grade: '연간' },
            ]
        }];
        console.log('✅ 379 가평읍공설묘지 사용료/관리비 분리');
        changed.push('park-0379');
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
    console.log('✨ 371~380 DB 동기화 완료!');
}
fix();
