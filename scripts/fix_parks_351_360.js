const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 351, 355, 357, 358, 359: 강화군 공설묘지 패턴 (사용료15K + 관리비15K) ──
    for (const [id, nm] of [
        ['park-0351', '하도리공설묘지'],
        ['park-0355', '도장리공설묘지'],
        ['park-0357', '동검리공설묘지'],
        ['park-0358', '두운리공동묘지'],
        ['park-0359', '말도공설묘지'],
    ]) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '공설묘지 사용료', price: 15000, feeType: 'USAGE', residency: 'LOCAL', grade: '강화군민만 이용가능', isRepresentative: true },
                { name: '공설묘지 관리비', price: 15000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '강화군민만 이용가능' },
            ]
        }];
        console.log('✅', id, nm, '→ 사용료/관리비 분리, LOCAL');
        changed.push(id);
    }

    // ── 352: grade 추가 ──
    const p352 = data.find(x => x.id === 'park-0352');
    if (p352) {
        p352.priceInfo.standardizedPrices[0].rows[0].grade = '2001년 만장에 따른 사용불가';
        console.log('✅ 352 하늘의문(당하동) grade 추가');
        changed.push('park-0352');
    }

    // ── 353: grade 보완, RESIDENT→LOCAL ──
    const p353 = data.find(x => x.id === 'park-0353');
    if (p353) {
        const row = p353.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '임실군민만 이용가능, 무료, 사용기간: 30년';
        row.residency = 'LOCAL';
        row.isRepresentative = true;
        console.log('✅ 353 임실군공설묘지 grade 보완, LOCAL');
        changed.push('park-0353');
    }

    // ── 354: grade 추가 ──
    const p354 = data.find(x => x.id === 'park-0354');
    if (p354) {
        p354.priceInfo.standardizedPrices[0].rows[0].grade = '북한산국립공원지정 매장·화장 금지';
        console.log('✅ 354 혜화동성당 도봉동묘원 grade 추가');
        changed.push('park-0354');
    }

    // ── 356: grade 보완, RESIDENT→LOCAL ──
    const p356 = data.find(x => x.id === 'park-0356');
    if (p356) {
        const row = p356.priceInfo.standardizedPrices[0].rows[0];
        row.grade = '이용자격: 나주시민, 사용기간: 15년, 사용료: 3.3m2당 1만원';
        row.residency = 'LOCAL';
        console.log('✅ 356 동강면공설묘지 grade 보완, LOCAL');
        changed.push('park-0356');
    }

    // ── 360: 망우역사문화공원 정리 ──
    const p360 = data.find(x => x.id === 'park-0360');
    if (p360) {
        p360.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 0, feeType: 'USAGE', grade: '1973.3 만장(1998.8 매장 중단), 비조성(관리비 없음)', isRepresentative: true }
            ]
        }];
        console.log('✅ 360 망우역사문화공원 정리');
        changed.push('park-0360');
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
    console.log('✨ 351~360 DB 동기화 완료!');
}
fix();
