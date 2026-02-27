const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 강화군 패턴: 424,425,427,429 ──
    for (const id of ['park-0424', 'park-0425', 'park-0427', 'park-0429']) {
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

    // ── 나주 패턴: 421,423 ──
    for (const id of ['park-0421', 'park-0423']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        const row = p.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 나주시민, 사용기간: 15년, 사용료: 3.3m2당 1만원';
        row.residency = 'LOCAL';
        console.log('✅', id, p.name, '→ grade 보완, LOCAL');
        changed.push(id);
    }

    // ── 가평군 패턴: 422 설악면, 426 상면 - 사용료+관리비 분리 ──
    for (const id of ['park-0422', 'park-0426']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '1구당 사용료', price: 125000, feeType: 'USAGE', grade: '1구당, 사용료: 12만5천원', isRepresentative: true },
                { name: '관리비 (연간)', price: 80000, feeType: 'MAINTENANCE', grade: '연간 관리비' },
            ]
        }];
        console.log('✅', id, p.name, '→ 사용료/관리비 분리, grade');
        changed.push(id);
    }

    // ── 제주 패턴: 428,430 - EXTENSION→USAGE ──
    for (const id of ['park-0428', 'park-0430']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        const row = p.priceInfo.standardizedPrices[0].rows[0];
        row.feeType = 'USAGE';
        row.grade = '이용자격: 제주도민, 사용기간: 15년, 3회 연장 가능';
        row.residency = 'LOCAL';
        console.log('✅', id, p.name, '→ USAGE, grade, LOCAL');
        changed.push(id);
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
    console.log('✨ 421~430 DB 동기화 완료!');
}
fix();
