const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function syncParks81to90() {
    console.log('🚀 parks 81-90 pricing → Supabase 동기화 시작...');

    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

    const targetIds = [
        'park-0081', 'park-0082', 'park-0083', 'park-0084', 'park-0085',
        'park-0086', 'park-0087', 'park-0088', 'park-0089', 'park-0090'
    ];

    for (const id of targetIds) {
        const f = facilities.find(d => d.id === id);
        if (!f || !f.priceInfo) {
            console.log(`⚠️ ${id}: priceInfo 없음, 스킵`);
            continue;
        }

        const pricingStr = JSON.stringify(f.priceInfo);

        const { error } = await supabase
            .from('Facility')
            .update({ pricing: pricingStr })
            .eq('id', id);

        if (error) {
            console.error(`❌ ${id} (${f.name}): ${error.message}`);
        } else {
            console.log(`✅ ${id} (${f.name}) → Supabase 업데이트 완료`);
        }
    }

    console.log('\n📊 동기화 완료!');
}

syncParks81to90();
