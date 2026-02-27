const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const changed = [];

    for (const p of data) {
        if (!p.priceInfo?.standardizedPrices) continue;
        let modified = false;
        for (const group of p.priceInfo.standardizedPrices) {
            if (!group.rows) continue;
            for (const row of group.rows) {
                if (row.grade && row.grade.includes('이용자격')) {
                    const before = row.grade;
                    // "이용자격: ", "이용자격 : ", "이용자격:" 등 다양한 패턴 제거
                    row.grade = row.grade.replace(/이용자격\s*:\s*/g, '').trim();
                    if (before !== row.grade) {
                        modified = true;
                    }
                }
            }
        }
        if (modified) {
            changed.push(p.id);
            console.log('✅', p.id, p.name);
        }
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 저장 완료 (' + changed.length + '개 park 수정)');

    // Supabase 동기화
    for (const id of changed) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
    }
    console.log('✨ Supabase 동기화 완료!');
}
fix();
