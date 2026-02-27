const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 강화군 패턴: 361,362,367,368,370 ──
    for (const id of ['park-0361', 'park-0362', 'park-0367', 'park-0368', 'park-0370']) {
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

    // ── 나주 패턴: 363,364,369 ──
    for (const id of ['park-0363', 'park-0364', 'park-0369']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        const row = p.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 나주시민, 사용기간: 15년, 사용료: 3.3m2당 1만원';
        row.residency = 'LOCAL';
        console.log('✅', id, p.name, '→ grade 보완, LOCAL');
        changed.push(id);
    }

    // ── 365: 벽제리묘지 ──
    const p365 = data.find(x => x.id === 'park-0365');
    if (p365) {
        p365.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 0, feeType: 'USAGE', grade: '1991.5 만장(1998.8 매장 중단), 비조성(관리비 없음)', isRepresentative: true }
            ]
        }];
        console.log('✅ 365 벽제리묘지 정리');
        changed.push('park-0365');
    }

    // ── 366: 보성공설묘지 (데이터 추가) ──
    const p366 = data.find(x => x.id === 'park-0366');
    if (p366) {
        p366.priceInfo = p366.priceInfo || {};
        p366.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 0, feeType: 'USAGE', grade: '만장(관리만 하고있음)', isRepresentative: true }
            ]
        }];
        console.log('✅ 366 보성공설묘지 데이터 추가');
        changed.push('park-0366');
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
    console.log('✨ 361~370 DB 동기화 완료!');
}
fix();
