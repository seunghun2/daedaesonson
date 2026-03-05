const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/facilities.json'), 'utf8'));
const supabase = createClient(
    'https://jbydmhfuqnpukfutvrgs.supabase.co',
    'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'
);

(async () => {
    const ids = [
        'park-0766', 'park-0767', 'park-0768', 'park-0769', 'park-0770',
        'park-0771', 'park-0772', 'park-0773', 'park-0774', 'park-0775'
    ];
    for (const id of ids) {
        const f = data.find(d => d.id === id);
        if (!f) continue;
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('✅', id, f.name, '→ Supabase 동기화');
    }
    console.log('🎉 완료');
})();
