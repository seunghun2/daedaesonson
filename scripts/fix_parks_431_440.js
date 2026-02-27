const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 강화군 패턴: 432,433,434,435 ──
    for (const id of ['park-0432', 'park-0433', 'park-0434', 'park-0435']) {
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

    // ── 431: 서산시희망공원(묘지) - grade 보완, LOCAL ──
    const p431 = data.find(x => x.id === 'park-0431');
    if (p431) {
        const row = p431.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 서산시 3개월 이상 거주, 사용기간: 15년, 10년씩 3회 연장 가능';
        row.residency = 'LOCAL';
        console.log('✅ 431 서산시희망공원(묘지) grade 보완, LOCAL');
        changed.push('park-0431');
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
    console.log('✨ 431~440 DB 동기화 완료!');
}
fix();
