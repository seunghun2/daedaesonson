const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // 공통 함수: 개인/부부 분리
    function splitIndivCouple(parkId, parkName) {
        const p = data.find(x => x.id === parkId);
        if (!p || !p.priceInfo?.standardizedPrices) return;

        const newSPs = [];
        p.priceInfo.standardizedPrices.forEach(g => {
            // 그룹별로 중복 체크
            const byGroup = {};
            g.rows.forEach(r => {
                const gt = r.groupType || '(없음)';
                if (!byGroup[gt]) byGroup[gt] = [];
                byGroup[gt].push(r);
            });

            // 중복이 있는지 확인
            let hasDups = false;
            Object.values(byGroup).forEach(rows => {
                const names = {};
                rows.forEach(r => {
                    const key = r.name + '|' + (r.grade || '');
                    if (!names[key]) names[key] = 0;
                    names[key]++;
                });
                if (Object.values(names).some(c => c > 1)) hasDups = true;
            });

            if (!hasDups) {
                newSPs.push(g);
                return;
            }

            // 개인/부부 분리
            const indivRows = [];
            const coupleRows = [];

            Object.entries(byGroup).forEach(([gt, rows]) => {
                // 관리비/부가옵션은 이름으로 개인/부부 구분
                if (gt === '부가옵션' || gt === '관리비') {
                    // 관리비는 개인에 낮은거, 부부에 높은거
                    const mgmts = rows.filter(r => r.name === '관리비');
                    const others = rows.filter(r => r.name !== '관리비');
                    if (mgmts.length === 2) {
                        const sorted = mgmts.sort((a, b) => a.price - b.price);
                        indivRows.push({ ...sorted[0], groupType: gt === '(없음)' ? undefined : gt });
                        coupleRows.push({ ...sorted[1], groupType: gt === '(없음)' ? undefined : gt });
                    } else {
                        mgmts.forEach(r => {
                            indivRows.push({ ...r, groupType: gt === '(없음)' ? undefined : gt });
                            coupleRows.push({ ...r, groupType: gt === '(없음)' ? undefined : gt });
                        });
                    }
                    // 기타 항목은 개인/부부 분류 (임시안치 등)
                    if (others.length >= 2) {
                        const nameGroups = {};
                        others.forEach(r => {
                            const k = r.name;
                            if (!nameGroups[k]) nameGroups[k] = [];
                            nameGroups[k].push(r);
                        });
                        Object.values(nameGroups).forEach(arr => {
                            if (arr.length === 2) {
                                const sorted = arr.sort((a, b) => a.price - b.price);
                                indivRows.push({ ...sorted[0], groupType: gt === '(없음)' ? undefined : gt });
                                coupleRows.push({ ...sorted[1], groupType: gt === '(없음)' ? undefined : gt });
                            } else {
                                arr.forEach(r => {
                                    indivRows.push({ ...r, groupType: gt === '(없음)' ? undefined : gt });
                                    coupleRows.push({ ...r, groupType: gt === '(없음)' ? undefined : gt });
                                });
                            }
                        });
                    } else {
                        others.forEach(r => {
                            indivRows.push({ ...r, groupType: gt === '(없음)' ? undefined : gt });
                            coupleRows.push({ ...r, groupType: gt === '(없음)' ? undefined : gt });
                        });
                    }
                    return;
                }

                // 일반 그룹: 전반부=개인, 후반부=부부
                const names = {};
                rows.forEach(r => {
                    const key = r.name + '|' + (r.grade || '');
                    if (!names[key]) names[key] = 0;
                    names[key]++;
                });
                const hasDup = Object.values(names).some(c => c > 1);

                if (!hasDup) {
                    // 중복 없으면 그대로 양쪽에 복사
                    rows.forEach(r => {
                        indivRows.push({ ...r });
                        coupleRows.push({ ...r });
                    });
                    return;
                }

                // 중복 있으면 반으로 쪼개기
                const half = Math.floor(rows.length / 2);
                for (let i = 0; i < half; i++) {
                    indivRows.push({ ...rows[i], groupType: gt === '(없음)' ? undefined : gt });
                }
                for (let i = half; i < rows.length; i++) {
                    coupleRows.push({ ...rows[i], groupType: gt === '(없음)' ? undefined : gt });
                }
            });

            // isRepresentative 설정
            if (indivRows.length > 0 && !indivRows.some(r => r.isRepresentative)) {
                const usage = indivRows.find(r => r.feeType === 'USAGE');
                if (usage) usage.isRepresentative = true;
            }

            newSPs.push({
                serviceType: g.serviceType,
                subType: g.subType + '(개인)',
                unit: g.unit,
                rows: indivRows,
            });
            newSPs.push({
                serviceType: g.serviceType,
                subType: g.subType + '(부부)',
                unit: g.unit,
                rows: coupleRows,
            });
        });

        p.priceInfo.standardizedPrices = newSPs;
        console.log('✅ ' + parkId + ' ' + parkName + ' → 개인/부부 분리');
        newSPs.forEach(g => console.log('  [' + g.serviceType + '] ' + g.subType + ': ' + g.rows.length + '건'));
        changed.push(parkId);
    }

    // 524, 525, 526, 527, 530 처리
    splitIndivCouple('park-0524', '마라나타하늘정원');
    splitIndivCouple('park-0525', '천국의계단추모관');
    splitIndivCouple('park-0526', '그린피아추모공원');
    splitIndivCouple('park-0527', '중앙추모공원');
    splitIndivCouple('park-0530', '무궁화추모공원');

    // 528: 복합단 쪼개기 (6,5단 → 5단+6단)
    const p528 = data.find(x => x.id === 'park-0528');
    if (p528) {
        p528.priceInfo.standardizedPrices.forEach(g => {
            const newRows = [];
            g.rows.forEach(r => {
                const match = r.name.match(/^(.*?)(\d+),(\d+)단(.*)$/);
                if (match) {
                    newRows.push({ ...r, name: match[1] + match[2] + '단' + match[4] });
                    newRows.push({ ...r, name: match[1] + match[3] + '단' + match[4] });
                } else {
                    newRows.push(r);
                }
            });
            g.rows = newRows;
        });
        console.log('✅ park-0528 유일추모공원 → 복합단 쪼개기');
        changed.push('park-0528');
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
        else console.log('✅ DB 동기화:', id);
    }
    console.log('✨ 완료!');
}
fix();
