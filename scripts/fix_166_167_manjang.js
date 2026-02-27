const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    for (const id of ['park-0166', 'park-0167']) {
        const p = data.find(x => x.id === id);
        p.priceInfo.standardizedPrices[0].subType = '매장묘 (만장)';
        p.priceInfo.standardizedPrices[0].rows[0].name = '조성분묘 관리비 (만장)';
        console.log('✅', id, p.name);

        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(p.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', error.message);
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 완료');
}
fix();
