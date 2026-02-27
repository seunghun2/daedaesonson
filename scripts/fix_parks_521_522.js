const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 522: 연천동막골추모관 - 가격 데이터 입력 ──
    const p522 = data.find(x => x.id === 'park-0522');
    if (p522) {
        p522.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
                rows: [
                    // 본관 (좌,우)
                    { name: '1단', price: 3000000, feeType: 'USAGE', isRepresentative: true, groupType: '본관' },
                    { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '3단', price: 6000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '4단', price: 7000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '7단', price: 5000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '본관' },
                    // 본관 (정면)
                    { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '본관(정면)' },
                    { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '본관(정면)' },
                    { name: '3단', price: 7000000, feeType: 'USAGE', groupType: '본관(정면)' },
                    { name: '4단', price: 8000000, feeType: 'USAGE', groupType: '본관(정면)' },
                    { name: '5단', price: 8000000, feeType: 'USAGE', groupType: '본관(정면)' },
                    { name: '6단', price: 8000000, feeType: 'USAGE', groupType: '본관(정면)' },
                    { name: '7단', price: 6000000, feeType: 'USAGE', groupType: '본관(정면)' },
                    { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '본관(정면)' },
                    // 신관 (좌,우)
                    { name: '1단', price: 3000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '2단', price: 4000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '3단', price: 5000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '4단', price: 6000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '5단', price: 6000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '6단', price: 6000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '7단', price: 4000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '8단', price: 3000000, feeType: 'USAGE', groupType: '신관' },
                    // 신관 (정면)
                    { name: '1단', price: 3500000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '2단', price: 5000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '3단', price: 6000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '4단', price: 7000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '5단', price: 7000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '6단', price: 7000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '7단', price: 5000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '8단', price: 3500000, feeType: 'USAGE', groupType: '신관(정면)' },
                    // 관리비 (개인)
                    { name: '관리비 (5년)', price: 300000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
                rows: [
                    // 본관 부부 (좌,우)
                    { name: '1단', price: 6000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '3단', price: 12000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '4단', price: 14000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '5단', price: 14000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '6단', price: 14000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '본관' },
                    { name: '8단', price: 6000000, feeType: 'USAGE', groupType: '본관' },
                    // 신관 부부 (좌,우)
                    { name: '1단', price: 6000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '2단', price: 8000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '3단', price: 10000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '4단', price: 12000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '5단', price: 12000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '6단', price: 12000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '7단', price: 8000000, feeType: 'USAGE', groupType: '신관' },
                    { name: '8단', price: 6000000, feeType: 'USAGE', groupType: '신관' },
                    // 신관 부부 (정면)
                    { name: '1단', price: 7000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '2단', price: 10000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '3단', price: 12000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '4단', price: 14000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '5단', price: 14000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '6단', price: 14000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '7단', price: 10000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    { name: '8단', price: 7000000, feeType: 'USAGE', groupType: '신관(정면)' },
                    // 관리비 (부부)
                    { name: '관리비 (5년)', price: 600000, feeType: 'MAINTENANCE' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '가족단', unit: '원',
                rows: [
                    { name: '본관 가족단 (8기)', price: 40000000, feeType: 'USAGE', isRepresentative: true },
                    { name: '관리비 (5년)', price: 1200000, feeType: 'MAINTENANCE' },
                ]
            }
        ];
        console.log('✅ 522 연천동막골추모관 → 가격 데이터 입력 (개인/부부/가족단 분리)');
        changed.push('park-0522');
    }

    // ── 521: 용인추모원 - 제품등급별 아코디언 분리 + 복합단 쪼개기 ──
    const p521 = data.find(x => x.id === 'park-0521');
    if (p521) {
        const old = p521.priceInfo.standardizedPrices[0].rows;

        // 이름에서 제품타입과 단 분리하는 헬퍼
        function parseRow(r) {
            // "15년임대 1/9단" → type: "15년임대", tiers: ["1단", "9단"]
            const match = r.name.match(/^(.+?)\s+(.+)$/);
            if (!match) return [{ ...r }];
            const type = match[1];
            const tierStr = match[2];
            // "1/9단" → ["1단", "9단"]
            const tierMatch = tierStr.match(/^(\d+)\/(\d+)단$/);
            if (tierMatch) {
                return [
                    { name: tierMatch[1] + '단', price: r.price, feeType: r.feeType, grade: r.grade },
                    { name: tierMatch[2] + '단', price: r.price, feeType: r.feeType, grade: r.grade },
                ];
            }
            // "3/4단" → ["3단", "4단"]
            const tierMatch2 = tierStr.match(/^(\d+)\/(\d+)단$/);
            if (tierMatch2) {
                return [
                    { name: tierMatch2[1] + '단', price: r.price, feeType: r.feeType, grade: r.grade },
                    { name: tierMatch2[2] + '단', price: r.price, feeType: r.feeType, grade: r.grade },
                ];
            }
            // "전단" or "3단" → keep as-is
            return [{ name: tierStr, price: r.price, feeType: r.feeType, grade: r.grade }];
        }

        // 임대 (지하, idx 0-5)
        const rentalRows = [];
        for (let i = 0; i <= 5; i++) {
            parseRow(old[i]).forEach(r => rentalRows.push({ ...r, groupType: '지하' }));
        }
        rentalRows[0].isRepresentative = true;

        // 디럭스 (지하, idx 6-11)
        const deluxeRows = [];
        for (let i = 6; i <= 11; i++) {
            parseRow(old[i]).forEach(r => deluxeRows.push({ ...r, groupType: '지하' }));
        }

        // 유니크가족 (1층, idx 12-14)
        const uniqueRows = [];
        for (let i = 12; i <= 14; i++) {
            parseRow(old[i]).forEach(r => uniqueRows.push({ ...r, groupType: '1층' }));
        }

        // 럭셔리 (1층 idx 15-19, 2층 idx 25-29)
        const luxuryRows = [];
        for (let i = 15; i <= 19; i++) {
            parseRow(old[i]).forEach(r => luxuryRows.push({ ...r, groupType: '1층' }));
        }
        for (let i = 25; i <= 29; i++) {
            parseRow(old[i]).forEach(r => luxuryRows.push({ ...r, groupType: '2층' }));
        }

        // 프리미엄 (2층, idx 20-24)
        const premiumRows = [];
        for (let i = 20; i <= 24; i++) {
            parseRow(old[i]).forEach(r => premiumRows.push({ ...r, groupType: '2층' }));
        }

        // 프리미엄가족 (3층, idx 30-45)
        const premFamilyRows = [];
        for (let i = 30; i <= 45; i++) {
            // 이것들은 이름이 복잡("프리미엄가족4기-1 1/6단") → 제품명 유지하되 단만 쪼개기
            const r = old[i];
            const match = r.name.match(/^(.+?)\s+(\d+)\/(\d+)단(.*)$/);
            if (match) {
                premFamilyRows.push({ name: match[1] + ' ' + match[2] + '단' + match[4], price: r.price, feeType: r.feeType, grade: r.grade, groupType: '3층' });
                premFamilyRows.push({ name: match[1] + ' ' + match[3] + '단' + match[4], price: r.price, feeType: r.feeType, grade: r.grade, groupType: '3층' });
            } else {
                premFamilyRows.push({ name: r.name, price: r.price, feeType: r.feeType, grade: r.grade, groupType: '3층' });
            }
        }

        // 관리비 (idx 46-49)
        const mgmt = old.slice(46);

        p521.priceInfo.standardizedPrices = [
            {
                serviceType: 'BONGSAN', subType: '봉안당(임대)', unit: '원',
                rows: [
                    ...rentalRows,
                    { name: '관리비', price: 250000, feeType: 'MAINTENANCE', grade: '5년' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(디럭스)', unit: '원',
                rows: deluxeRows,
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(럭셔리)', unit: '원',
                rows: [
                    ...luxuryRows,
                    { name: '관리비', price: 2500000, feeType: 'MAINTENANCE', grade: '럭셔리' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(프리미엄)', unit: '원',
                rows: [
                    ...premiumRows,
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', grade: '프리미엄' },
                ]
            },
            {
                serviceType: 'BONGSAN', subType: '봉안당(가족실)', unit: '원',
                rows: [
                    ...uniqueRows,
                    ...premFamilyRows,
                    { name: '관리비', price: 350000, feeType: 'MAINTENANCE', grade: '유니크' },
                ]
            },
        ];
        console.log('✅ 521 용인추모원 → 등급별 아코디언 분리 + 복합단 쪼개기');
        p521.priceInfo.standardizedPrices.forEach(g => console.log('  ' + g.subType + ': ' + g.rows.length + '건'));
        changed.push('park-0521');
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
