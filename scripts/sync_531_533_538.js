const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    'https://jbydmhfuqnpukfutvrgs.supabase.co',
    'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'
);

async function sync() {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facilities.json'), 'utf8'));
    const ids = ['park-0531', 'park-0533', 'park-0538'];
    let success = 0;

    for (const id of ids) {
        const park = data.find(x => x.id === id);
        if (!park) continue;
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(park.priceInfo) })
            .eq('id', id);
        if (error) {
            console.error('❌ ' + id + ' ' + park.name + ': ' + error.message);
        } else {
            console.log('✅ ' + id + ' ' + park.name + ' → DB 동기화 완료');
            success++;
        }
    }
    console.log('\n📊 ' + success + '/' + ids.length + '개 동기화 완료');
}
sync();
