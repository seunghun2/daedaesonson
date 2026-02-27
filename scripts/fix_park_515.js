const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p515 = data.find(x => x.id === 'park-0515');
    if (!p515) { console.log('NOT FOUND'); return; }

    const rows = p515.priceInfo.standardizedPrices[0].rows;

    // 헬퍼: 복합단 쪼개기 (1,7단 → [1단, 7단])
    function splitTiers(name, price, opts) {
        const match = name.match(/^(\d+),(\d+)단$/);
        if (match) {
            return [
                { name: match[1] + '단', price, ...opts },
                { name: match[2] + '단', price, ...opts },
            ];
        }
        return [{ name, price, ...opts }];
    }

    // ── A관 개인 (idx 0-7) ──
    const aIndiv = [];
    for (let i = 0; i <= 7; i++) {
        const r = rows[i];
        splitTiers(r.name, r.price, { feeType: 'USAGE' }).forEach(s => aIndiv.push(s));
    }
    aIndiv[0].isRepresentative = true; // 10단 = 최저가

    // ── A관 부부 (idx 8-15) ──
    const aCouple = [];
    for (let i = 8; i <= 15; i++) {
        const r = rows[i];
        splitTiers(r.name, r.price, { feeType: 'USAGE' }).forEach(s => aCouple.push(s));
    }

    // ── B관 개인 (idx 16-25) ──
    const bIndiv = [];
    for (let i = 16; i <= 25; i++) {
        bIndiv.push({ name: rows[i].name, price: rows[i].price, feeType: 'USAGE' });
    }

    // ── B관 부부 (idx 26-35) ──
    const bCouple = [];
    for (let i = 26; i <= 35; i++) {
        bCouple.push({ name: rows[i].name, price: rows[i].price, feeType: 'USAGE' });
    }

    // ── B관(정면) 개인 (idx 36-45) ──
    const bfIndiv = [];
    for (let i = 36; i <= 45; i++) {
        bfIndiv.push({ name: rows[i].name, price: rows[i].price, feeType: 'USAGE' });
    }

    // ── B관(정면) 부부 (idx 46-55) ──
    const bfCouple = [];
    for (let i = 46; i <= 55; i++) {
        bfCouple.push({ name: rows[i].name, price: rows[i].price, feeType: 'USAGE' });
    }

    // ── 2B관 개인 (idx 56-64) ──
    const b2Indiv = [];
    for (let i = 56; i <= 64; i++) {
        b2Indiv.push({ name: rows[i].name, price: rows[i].price, feeType: 'USAGE' });
    }

    // ── 2B관 부부 (idx 65-71) ──
    const b2Couple = [];
    for (let i = 65; i <= 71; i++) {
        b2Couple.push({ name: rows[i].name, price: rows[i].price, feeType: 'USAGE' });
    }

    // ── 관리비: 72-73 개인, 74-75 부부 ──
    const mgmtIndiv = [
        { name: '관리비', price: 250000, feeType: 'MAINTENANCE' },
        { name: '관리비', price: 450000, feeType: 'MAINTENANCE' },
    ];
    const mgmtCouple = [
        { name: '관리비 (2인)', price: 500000, feeType: 'MAINTENANCE' },
        { name: '관리비 (2인)', price: 900000, feeType: 'MAINTENANCE' },
    ];

    // ── 최종 구조 ──
    p515.priceInfo.standardizedPrices = [
        {
            serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원',
            rows: [
                ...aIndiv.map(r => ({ ...r, groupType: 'A관' })),
                ...bIndiv.map(r => ({ ...r, groupType: 'B관' })),
                ...bfIndiv.map(r => ({ ...r, groupType: 'B관(정면)' })),
                ...b2Indiv.map(r => ({ ...r, groupType: '2B관' })),
                ...mgmtIndiv,
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원',
            rows: [
                ...aCouple.map(r => ({ ...r, groupType: 'A관' })),
                ...bCouple.map(r => ({ ...r, groupType: 'B관' })),
                ...bfCouple.map(r => ({ ...r, groupType: 'B관(정면)' })),
                ...b2Couple.map(r => ({ ...r, groupType: '2B관' })),
                ...mgmtCouple,
            ]
        }
    ];

    console.log('✅ 515 에덴추모공원 정리 완료');
    console.log('  봉안당(개인):', p515.priceInfo.standardizedPrices[0].rows.length + '건');
    console.log('  봉안당(부부):', p515.priceInfo.standardizedPrices[1].rows.length + '건');

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // DB 동기화
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p515.priceInfo) })
        .eq('id', 'park-0515');
    if (error) console.log('❌', error.message);
    else console.log('✅ DB 동기화: park-0515');
    console.log('✨ 완료!');
}
fix();
