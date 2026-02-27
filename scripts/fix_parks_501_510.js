const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 510: 분당추모공원휴 - OTHER → BONGSAN ──
    const p510 = data.find(x => x.id === 'park-0510');
    if (p510) {
        const sp = p510.priceInfo.standardizedPrices;
        sp.forEach(g => {
            if (g.subType === '야외봉안담' || g.subType === '실내봉안당') {
                console.log('  변경: [' + g.serviceType + '] ' + g.subType + ' → [BONGSAN] ' + g.subType);
                g.serviceType = 'BONGSAN';
            }
        });
        console.log('✅ 510 분당추모공원휴 → OTHER→BONGSAN');
        changed.push('park-0510');
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
