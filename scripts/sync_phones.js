const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function syncPhones() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const withPhone = data.filter(p => p.phone && p.phone.trim());
    console.log(`📞 전화번호 있는 시설: ${withPhone.length}개`);

    let ok = 0, fail = 0;
    // 50개씩 배치 처리
    for (let i = 0; i < withPhone.length; i += 50) {
        const batch = withPhone.slice(i, i + 50);
        const promises = batch.map(p =>
            supabase.from('Facility').update({ phone: p.phone.trim() }).eq('id', p.id)
        );
        const results = await Promise.all(promises);
        results.forEach((r, j) => {
            if (r.error) { console.log(`❌ ${batch[j].id}: ${r.error.message}`); fail++; }
            else ok++;
        });
        process.stdout.write(`  ${Math.min(i + 50, withPhone.length)}/${withPhone.length}\r`);
    }
    console.log(`\n✨ 완료! 성공: ${ok}, 실패: ${fail}`);
}
syncPhones();
