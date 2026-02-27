const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(x => x.id === 'park-0516');
    if (!p) { console.log('NOT FOUND'); return; }
    const rows = p.priceInfo.standardizedPrices[0].rows;

    // 그룹별 개인/부부 인덱스 매핑
    const groups = [
        { name: 'B1층', indiv: [0, 1, 2, 3, 4, 5, 6, 7], couple: [37, 38, 39, 40, 41, 42, 43, 44] },
        { name: '1층', indiv: [8, 9, 10, 11, 12, 13, 14, 15], couple: [45, 46, 47, 48, 49, 50, 51, 52] },
        { name: '2층', indiv: [16, 17, 18, 19, 20, 21, 22], couple: [53, 54, 55, 56, 57, 58, 59] },
        { name: '3층', indiv: [23, 24, 25, 26, 27, 28, 29], couple: [60, 61, 62, 63, 64, 65, 66] },
        { name: '특별실', indiv: [30, 31, 32, 33, 34, 35, 36], couple: [67, 68, 69, 70, 71, 72, 73] },
    ];

    const indivRows = [];
    const coupleRows = [];

    groups.forEach(g => {
        g.indiv.forEach(i => {
            const r = rows[i];
            indivRows.push({ name: r.name, price: r.price, feeType: 'USAGE', groupType: g.name });
        });
        g.couple.forEach(i => {
            const r = rows[i];
            coupleRows.push({ name: r.name, price: r.price, feeType: 'USAGE', groupType: g.name });
        });
    });

    // 대표가 설정: B1층 1단 (최저가)
    indivRows[0].isRepresentative = true;

    p.priceInfo.standardizedPrices = [
        { serviceType: 'BONGSAN', subType: '봉안당(개인)', unit: '원', rows: indivRows },
        { serviceType: 'BONGSAN', subType: '봉안당(부부)', unit: '원', rows: coupleRows },
    ];

    console.log('✅ 516 팔공산도림사추모공원 정리 완료');
    console.log('  봉안당(개인):', indivRows.length + '건');
    console.log('  봉안당(부부):', coupleRows.length + '건');

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0516');
    if (error) console.log('❌', error.message);
    else console.log('✅ DB 동기화: park-0516');
    console.log('✨ 완료!');
}
fix();
