const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const targetIds = [];
    for (let i = 100; i <= 110; i++) targetIds.push('park-' + String(i).padStart(4, '0'));

    let fixCount = 0;
    const updated = [];

    targetIds.forEach(id => {
        const p = data.find(d => d.id === id);
        if (!p) return;
        const sp = p.priceInfo?.standardizedPrices;
        if (!sp) return;
        let changed = false;
        sp.forEach(g => {
            g.rows.forEach(r => {
                if (r.residency === 'RESIDENT') {
                    r.residency = 'LOCAL';
                    fixCount++;
                    changed = true;
                }
                if (r.residency === 'NON_RESIDENT') {
                    r.residency = 'NON_LOCAL';
                    fixCount++;
                    changed = true;
                }
            });
        });
        if (changed) updated.push(id);
    });

    console.log('🔧 ' + fixCount + '개 항목 수정 (RESIDENT→LOCAL)');

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        console.log(error ? '❌ ' + id : '✅ ' + id + ' (' + f.name + ')');
    }
}
fix();
