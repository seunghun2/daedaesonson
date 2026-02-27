const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 강화군 패턴: 392,396,399 ──
    for (const id of ['park-0392', 'park-0396', 'park-0399']) {
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

    // ── 나주 패턴: 391,394,397,398 ──
    for (const id of ['park-0391', 'park-0394', 'park-0397', 'park-0398']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        const row = p.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 나주시민, 사용기간: 15년, 사용료: 3.3m2당 1만원';
        row.residency = 'LOCAL';
        console.log('✅', id, p.name, '→ grade 보완, LOCAL');
        changed.push(id);
    }

    // ── 393: 남원읍공설묘지 - 제주 EXTENSION→USAGE ──
    const p393 = data.find(x => x.id === 'park-0393');
    if (p393) {
        const row = p393.priceInfo.standardizedPrices[0].rows[0];
        row.feeType = 'USAGE';
        row.grade = '이용자격: 제주도민, 사용기간: 15년, 3회 연장 가능';
        row.residency = 'LOCAL';
        console.log('✅ 393 남원읍공설묘지 USAGE, grade, LOCAL');
        changed.push('park-0393');
    }

    // ── 395: 내곡리묘지 - 만장 정리 ──
    const p395 = data.find(x => x.id === 'park-0395');
    if (p395) {
        p395.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 0, feeType: 'USAGE', grade: '1982.12 만장(1998.8 매장 중단), 비조성(관리비 없음)', isRepresentative: true }
            ]
        }];
        console.log('✅ 395 내곡리묘지 만장 정리');
        changed.push('park-0395');
    }

    // ── 400: 대정읍공설묘지 - grade 보완 ──
    const p400 = data.find(x => x.id === 'park-0400');
    if (p400) {
        const row = p400.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '관내(1인) 시설사용료';
        console.log('✅ 400 대정읍공설묘지 grade 보완');
        changed.push('park-0400');
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
    console.log('✨ 391~400 DB 동기화 완료!');
}
fix();
