const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 강화군 패턴: 401,402,410 ──
    for (const id of ['park-0401', 'park-0402', 'park-0410']) {
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

    // ── 나주 패턴: 404,406,407 ──
    for (const id of ['park-0404', 'park-0406', 'park-0407']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        const row = p.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 나주시민, 사용기간: 15년, 사용료: 3.3m2당 1만원';
        row.residency = 'LOCAL';
        console.log('✅', id, p.name, '→ grade 보완, LOCAL');
        changed.push(id);
    }

    // ── 제주 패턴: 403,408 - EXTENSION→USAGE ──
    for (const id of ['park-0403', 'park-0408']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        const row = p.priceInfo.standardizedPrices[0].rows[0];
        row.feeType = 'USAGE';
        row.grade = '이용자격: 제주도민, 사용기간: 15년, 3회 연장 가능';
        row.residency = 'LOCAL';
        console.log('✅', id, p.name, '→ USAGE, grade, LOCAL');
        changed.push(id);
    }

    // ── 405: 의정부시공설묘지 - grade 보완 ──
    const p405 = data.find(x => x.id === 'park-0405');
    if (p405) {
        const row = p405.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '기준면적 5m², 사용기간: 15년';
        console.log('✅ 405 의정부시공설묘지 grade 보완');
        changed.push('park-0405');
    }

    // ── 409: 송월교회(묘지) - grade 보완 ──
    const p409 = data.find(x => x.id === 'park-0409');
    if (p409) {
        const row = p409.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '비조성묘지 3.3m당';
        console.log('✅ 409 송월교회(묘지) grade 보완');
        changed.push('park-0409');
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
    console.log('✨ 401~410 DB 동기화 완료!');
}
fix();
