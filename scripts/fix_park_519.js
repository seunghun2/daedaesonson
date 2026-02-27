const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(x => x.id === 'park-0519');
    if (!p) { console.log('NOT FOUND'); return; }

    const sp = p.priceInfo.standardizedPrices[0]; // 봉안당
    const normalRows = [];
    const expandRows = [];

    sp.rows.forEach(r => {
        if (r.name.includes('확장형')) {
            // 확장형 → 이름에서 ' (확장형)' 제거하고 별도 아코디언에
            const newRow = { ...r, name: r.name.replace(' (확장형)', '').replace('(확장형)', '') };
            expandRows.push(newRow);
        } else {
            normalRows.push({ ...r });
        }
    });

    p.priceInfo.standardizedPrices = [
        { serviceType: 'BONGSAN', subType: '봉안당', unit: '원', rows: normalRows },
        { serviceType: 'BONGSAN', subType: '봉안당(확장형)', unit: '원', rows: expandRows },
    ];

    console.log('✅ 519 양평추모공원 더포레 정리 완료');
    console.log('  봉안당:', normalRows.length + '건');
    console.log('  봉안당(확장형):', expandRows.length + '건');

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0519');
    if (error) console.log('❌', error.message);
    else console.log('✅ DB 동기화: park-0519');
    console.log('✨ 완료!');
}
fix();
