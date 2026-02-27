const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    // ── 464: 수목장 문구 수정 ──
    const p464 = data.find(x => x.id === 'park-0464');
    if (p464) {
        const natural = p464.priceInfo.standardizedPrices.find(s => s.serviceType === 'NATURAL');
        if (natural) {
            const row = natural.rows.find(r => r.name === '수목장 (부부목 / 1~2위)');
            if (row) {
                row.name = '부부(형)목/1~2분 안치';
                console.log('✅ 464 수목장 문구 수정: "수목장 (부부목 / 1~2위)" → "부부(형)목/1~2분 안치"');
            }
        }
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    // DB 동기화
    const f = data.find(d => d.id === 'park-0464');
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(f.priceInfo) })
        .eq('id', 'park-0464');
    if (error) console.log('❌', error.message);
    else console.log('✅ DB 동기화: park-0464');
    console.log('✨ 완료!');
}
fix();
