const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(d => d.id === 'park-0150');
    const row = p.priceInfo.standardizedPrices[0].rows.find(r => r.name === '토지 사용료');
    console.log('변경 전:', row.price);
    row.price = 900000;
    console.log('변경 후:', row.price);

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    const { error } = await supabase.from('Facility').update({ pricing: JSON.stringify(p.priceInfo) }).eq('id', 'park-0150');
    console.log(error ? `❌ ${error.message}` : `✅ park-0150 (${p.name}) 업데이트 완료`);
}
fix();
