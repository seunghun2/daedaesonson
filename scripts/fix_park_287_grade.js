const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(x => x.id === 'park-0287');
    const row = p.priceInfo.standardizedPrices[0].rows[0];
    console.log('before:', row.grade);
    row.grade = '평당 3.3m²';
    console.log('after:', row.grade);

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0287');
    if (error) console.log('❌', error.message);
    else console.log('✅ park-0287 grade 수정 완료');
}
fix();
