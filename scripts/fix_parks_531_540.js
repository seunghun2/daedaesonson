const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // 공통: 개인/부부 분리
    function splitIndivCouple(parkId) {
        const p = data.find(x => x.id === parkId);
        if (!p || !p.priceInfo?.standardizedPrices) return;
        const newSPs = [];
        p.priceInfo.standardizedPrices.forEach(g => {
            const byGroup = {};
            g.rows.forEach(r => {
                const gt = r.groupType || '(없음)';
                if (!byGroup[gt]) byGroup[gt] = [];
                byGroup[gt].push(r);
            });
            let hasDups = false;
            Object.values(byGroup).forEach(rows => {
                const names = {};
                rows.forEach(r => { const k = r.name + '|' + (r.grade || ''); names[k] = (names[k] || 0) + 1; });
                if (Object.values(names).some(c => c > 1)) hasDups = true;
            });
            if (!hasDups) { newSPs.push(g); return; }
            const indivRows = [], coupleRows = [];
            Object.entries(byGroup).forEach(([gt, rows]) => {
                const gtVal = gt === '(없음)' ? undefined : gt;
                if (gt === '부가옵션') {
                    const nameGrp = {};
                    rows.forEach(r => { if (!nameGrp[r.name]) nameGrp[r.name] = []; nameGrp[r.name].push(r); });
                    Object.values(nameGrp).forEach(arr => {
                        if (arr.length === 2) {
                            const s = arr.sort((a, b) => a.price - b.price);
                            indivRows.push({ ...s[0], groupType: gtVal });
                            coupleRows.push({ ...s[1], groupType: gtVal });
                        } else if (arr.length === 4) {
                            // 4건: 개인 2종 + 부부 2종 (532처럼 관리비 4건)
                            const s = arr.sort((a, b) => a.price - b.price);
                            indivRows.push({ ...s[0], groupType: gtVal });
                            indivRows.push({ ...s[1], groupType: gtVal });
                            coupleRows.push({ ...s[2], groupType: gtVal });
                            coupleRows.push({ ...s[3], groupType: gtVal });
                        } else {
                            arr.forEach(r => { indivRows.push({ ...r, groupType: gtVal }); coupleRows.push({ ...r, groupType: gtVal }); });
                        }
                    });
                    return;
                }
                const names = {};
                rows.forEach(r => { const k = r.name + '|' + (r.grade || ''); names[k] = (names[k] || 0) + 1; });
                const hasDup = Object.values(names).some(c => c > 1);
                if (!hasDup) {
                    rows.forEach(r => { indivRows.push({ ...r }); coupleRows.push({ ...r }); });
                    return;
                }
                const half = Math.floor(rows.length / 2);
                for (let i = 0; i < half; i++) indivRows.push({ ...rows[i], groupType: gtVal });
                for (let i = half; i < rows.length; i++) coupleRows.push({ ...rows[i], groupType: gtVal });
            });
            if (indivRows.length > 0 && !indivRows.some(r => r.isRepresentative)) {
                const u = indivRows.find(r => r.feeType === 'USAGE');
                if (u) u.isRepresentative = true;
            }
            newSPs.push({ serviceType: g.serviceType, subType: g.subType + '(개인)', unit: g.unit, rows: indivRows });
            newSPs.push({ serviceType: g.serviceType, subType: g.subType + '(부부)', unit: g.unit, rows: coupleRows });
        });
        p.priceInfo.standardizedPrices = newSPs;
        console.log('✅ ' + parkId + ' ' + p.name + ' → 개인/부부 분리');
        newSPs.forEach(g => console.log('  ' + g.subType + ': ' + g.rows.length + '건'));
        changed.push(parkId);
    }

    // 공통: 복합단 쪼개기 (1,7단 → 1단+7단)
    function splitCompoundTiers(parkId) {
        const p = data.find(x => x.id === parkId);
        if (!p || !p.priceInfo?.standardizedPrices) return;
        let count = 0;
        p.priceInfo.standardizedPrices.forEach(g => {
            const newRows = [];
            g.rows.forEach(r => {
                const match = r.name.match(/^(.*)(\d+),(\d+)단(.*)$/);
                if (match) {
                    newRows.push({ ...r, name: match[1] + match[2] + '단' + match[4] });
                    newRows.push({ ...r, name: match[1] + match[3] + '단' + match[4] });
                    count++;
                } else {
                    newRows.push(r);
                }
            });
            g.rows = newRows;
        });
        if (count > 0) {
            console.log('  + 복합단 ' + count + '건 쪼개기');
            if (!changed.includes(parkId)) changed.push(parkId);
        }
    }

    // === 531 모악추모공원 ===
    splitIndivCouple('park-0531');

    // === 532 도성사 봉안당 === 
    // 복합단 먼저 쪼개고, 5면 개인/부부는 이미 groupType으로 분리됨
    // 하지만 일반 그룹에도 중복 있음 → 분리
    splitCompoundTiers('park-0532');
    splitIndivCouple('park-0532');

    // === 534 신불산추모공원 === 
    // 이미 개인/부부 groupType으로 깔끔하게 나뉘어있음 → 아코디언으로 분리
    const p534 = data.find(x => x.id === 'park-0534');
    if (p534) {
        const sp = p534.priceInfo.standardizedPrices[0];
        const indiv = sp.rows.filter(r => r.groupType === '개인');
        const couple = sp.rows.filter(r => r.groupType === '부부');
        // groupType 제거 (아코디언이 대신하므로)
        indiv.forEach(r => delete r.groupType);
        couple.forEach(r => delete r.groupType);
        if (indiv.length > 0) indiv[0].isRepresentative = true;
        p534.priceInfo.standardizedPrices = [
            { serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원', rows: indiv },
            { serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원', rows: couple },
        ];
        console.log('✅ park-0534 신불산추모공원 → 개인/부부 아코디언 분리');
        changed.push('park-0534');
    }

    // === 535 청련사 극락원 ===
    splitIndivCouple('park-0535');

    // === 537 재단법인조안공원양주지사 ===
    splitIndivCouple('park-0537');

    // === 539 (재)법화세계추모관 ===
    splitIndivCouple('park-0539');

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    for (const id of changed) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('✅ DB 동기화:', id);
    }
    console.log('✨ 완료!');
}
fix();
