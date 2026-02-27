const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 341: grade 추가 ──
    const p341 = data.find(x => x.id === 'park-0341');
    if (p341) {
        p341.priceInfo.standardizedPrices[0].rows[0].grade = '2001년 만장에 따른 사용불가';
        console.log('✅ 341 하늘의문 grade 추가');
        changed.push('park-0341');
    }

    // ── 342: grade 보완 ──
    const p342 = data.find(x => x.id === 'park-0342');
    if (p342) {
        p342.priceInfo.standardizedPrices[0].rows[0].grade = '납골평장 0.8m(80x100)';
        console.log('✅ 342 안양시청계공설묘지 grade 보완');
        changed.push('park-0342');
    }

    // ── 343: grade 보완 ──
    const p343 = data.find(x => x.id === 'park-0343');
    if (p343) {
        p343.priceInfo.standardizedPrices[0].rows[0].grade = '3.6평형(공유면적 포함), 사용기간: 15년';
        console.log('✅ 343 정읍시입암묘지공원 grade 보완');
        changed.push('park-0343');
    }

    // ── 344: 사용료 125K + 관리비 80K 분리 ──
    const p344 = data.find(x => x.id === 'park-0344');
    if (p344) {
        p344.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 125000, feeType: 'USAGE', grade: '1기당', isRepresentative: true },
                { name: '관리비', price: 80000, feeType: 'MAINTENANCE', grade: '연간' },
            ]
        }];
        console.log('✅ 344 청평면공설묘지 사용료/관리비 분리');
        changed.push('park-0344');
    }

    // ── 345, 347, 350: 강화군 공설묘지 패턴 (사용료15K + 관리비15K) ──
    for (const [id, nm] of [['park-0345', '창리공설묘지'], ['park-0347', '초지리공설묘지'], ['park-0350', '지석리공설묘지']]) {
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

    // ── 346: 조천읍공설묘지 EXTENSION→USAGE, RESIDENT→LOCAL ──
    const p346 = data.find(x => x.id === 'park-0346');
    if (p346) {
        p346.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '공설묘지 사용료', price: 200000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 제주도민, 사용기간: 15년, 3회연장 가능', isRepresentative: true }
            ]
        }];
        console.log('✅ 346 조천읍공설묘지 → USAGE/LOCAL');
        changed.push('park-0346');
    }

    // ── 348: feeType MAINTENANCE→USAGE ──
    const p348 = data.find(x => x.id === 'park-0348');
    if (p348) {
        p348.priceInfo.standardizedPrices[0].rows[0].feeType = 'USAGE';
        console.log('✅ 348 충해공원묘지 feeType → USAGE');
        changed.push('park-0348');
    }

    // ── 349: 데이터 추가 ──
    const p349 = data.find(x => x.id === 'park-0349');
    if (p349) {
        p349.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '일반인 사용불가', price: 0, feeType: 'USAGE', grade: '무연고 및 연고자를 알 수 없는 행려사망자의 시체에 한정하여 매장을 허가 할 수 있다', isRepresentative: true }
            ]
        }];
        console.log('✅ 349 합성동공설묘지 데이터 추가');
        changed.push('park-0349');
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
    console.log('✨ 341~350 DB 동기화 완료!');
}
fix();
