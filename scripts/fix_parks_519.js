const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 519: 양평추모공원 더포레 - 미분류 → 가족단/갤러리형 ──
    const p519 = data.find(x => x.id === 'park-0519');
    if (p519) {
        p519.priceInfo.standardizedPrices.forEach(g => {
            g.rows.forEach(r => {
                if (r.groupType === '미분류') {
                    if (r.name.includes('가족단')) {
                        r.groupType = '가족단';
                    } else if (r.name.includes('갤러리형')) {
                        r.groupType = '갤러리형';
                    }
                }
            });
        });
        console.log('✅ 519 양평추모공원 더포레 → 미분류 → 가족단/갤러리형 그룹 분류');
        changed.push('park-0519');
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
