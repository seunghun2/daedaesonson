const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 331: isRepresentative 중복 제거 ──
    const p331 = data.find(x => x.id === 'park-0331');
    if (p331) {
        const rows = p331.priceInfo.standardizedPrices[0].rows;
        // 관리비에서 isRepresentative 제거
        const maint = rows.find(r => r.feeType === 'MAINTENANCE');
        if (maint && maint.isRepresentative) {
            delete maint.isRepresentative;
            console.log('✅ 331 관리비 isRepresentative 제거');
        }
        changed.push('park-0331');
    }

    // ── 332~334: 포천시 공설묘지 EXTENSION→USAGE, RESIDENT→LOCAL ──
    for (const id of ['park-0332', 'park-0333', 'park-0334']) {
        const p = data.find(x => x.id === id);
        if (!p) continue;
        p.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '공설묘지 사용료', price: 40000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 포천시민(6개월 이상 거주), 사용기간: 15년, 3회연장 가능', isRepresentative: true },
                { name: '공설묘지 관리비', price: 50000, feeType: 'MAINTENANCE', residency: 'LOCAL', grade: '이용자격: 포천시민(6개월 이상 거주), 사용기간: 15년, 3회연장 가능' },
            ]
        }];
        console.log('✅', id, p.name, '→ USAGE/LOCAL');
        changed.push(id);
    }

    // ── 335: 이동공설묘지(만장) ──
    const p335 = data.find(x => x.id === 'park-0335');
    if (p335) {
        p335.priceInfo.standardizedPrices = [{
            serviceType: 'NATURAL', subType: '수목장', unit: '원',
            rows: [
                { name: '봉안시설 및 자연장지 이용', price: 0, feeType: 'USAGE', grade: '분양하는 시설묘지 아님(만장)', isRepresentative: true }
            ]
        }];
        console.log('✅ 335 이동공설묘지(만장) → grade 수정, EXTENSION→USAGE');
        changed.push('park-0335');
    }

    // ── 336: 학의동공설묘지(만장) ──
    const p336 = data.find(x => x.id === 'park-0336');
    if (p336) {
        p336.priceInfo.standardizedPrices = [{
            serviceType: 'NATURAL', subType: '수목장', unit: '원',
            rows: [
                { name: '봉안시설 및 자연장지 이용', price: 0, feeType: 'USAGE', grade: '분양하는 시설묘지 아님(만장)', isRepresentative: true }
            ]
        }];
        console.log('✅ 336 학의동공설묘지(만장) → grade 수정, EXTENSION→USAGE');
        changed.push('park-0336');
    }

    // ── 337: 후방산 공설묘지 grade 1구당→1기당 ──
    const p337 = data.find(x => x.id === 'park-0337');
    if (p337) {
        p337.priceInfo.standardizedPrices[0].rows[0].grade = '1기당';
        console.log('✅ 337 후방산 공설묘지 grade → 1기당');
        changed.push('park-0337');
    }

    // ── 338: 천도교 무봉공원 grade 추가 ──
    const p338 = data.find(x => x.id === 'park-0338');
    if (p338) {
        p338.priceInfo.standardizedPrices[0].rows[0].grade = '1기(3평 기준)';
        console.log('✅ 338 천도교 무봉공원 grade → 1기(3평 기준)');
        changed.push('park-0338');
    }

    // ── 339: 천주교 양산동묘원 → 사용료 0 제거, 관리비 20,000 ──
    const p339 = data.find(x => x.id === 'park-0339');
    if (p339) {
        p339.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '관리비', price: 20000, feeType: 'MAINTENANCE', grade: '연 20,000원', isRepresentative: true }
            ]
        }];
        console.log('✅ 339 천주교 양산동묘원 → 사용료 제거, 관리비 20,000');
        changed.push('park-0339');
    }

    // ── 340: 표선면공설묘지 EXTENSION→USAGE, RESIDENT→LOCAL ──
    const p340 = data.find(x => x.id === 'park-0340');
    if (p340) {
        p340.priceInfo.standardizedPrices = [{
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '공설묘지 사용료', price: 50000, feeType: 'USAGE', residency: 'LOCAL', grade: '이용자격: 제주도민, 사용기간: 15년, 3회연장 가능', isRepresentative: true }
            ]
        }];
        console.log('✅ 340 표선면공설묘지 → USAGE/LOCAL');
        changed.push('park-0340');
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
    console.log('✨ 331~340 DB 동기화 완료!');
}
fix();
