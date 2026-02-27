const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(x => x.id === 'park-0154');
    p.priceInfo.standardizedPrices.forEach(g => {
        g.rows.forEach(r => {
            if (r.grade && r.grade.includes('(031-334-0807)')) {
                r.grade = r.grade.replace(' (031-334-0807)', '');
                console.log('Fixed grade:', r.name, '→', r.grade);
            }
        });
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0154');
    if (error) console.log('❌', error.message);
    else console.log('✅ park-0154 Supabase 동기화 완료');
}
fix();
