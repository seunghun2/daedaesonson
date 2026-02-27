const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const updated = [];
    let fixedRows = 0;

    data.forEach(p => {
        const sp = p.priceInfo?.standardizedPrices;
        if (!sp) return;
        let changed = false;
        sp.forEach(g => {
            g.rows.forEach(r => {
                const hasGrade = r.grade && r.grade.trim();
                const hasNote = r.note && r.note.trim();
                // note만 있고 grade 없는 경우 → note를 grade로 복사
                if (hasNote && !hasGrade) {
                    r.grade = r.note;
                    changed = true;
                    fixedRows++;
                }
            });
        });
        if (changed) updated.push(p.id);
    });

    console.log(`📝 ${updated.length}개 시설, ${fixedRows}개 항목의 note → grade 복사`);

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // Supabase 동기화
    let ok = 0, fail = 0;
    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) { console.log(`❌ ${id}: ${error.message}`); fail++; }
        else ok++;
    }
    console.log(`\n✨ 완료! 성공: ${ok}, 실패: ${fail}`);
}
fix();
