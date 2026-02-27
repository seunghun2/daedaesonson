const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const p = data.find(d => d.id === 'park-0093');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '평장묘',
            rows: [
                { name: '평장묘 묘지사용금', price: 3500000, isRepresentative: true, note: '3.3㎡' },
                { name: '평장묘 관리비', price: 20000, feeType: 'MAINTENANCE', note: '3.3㎡' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '[선택]석물',
            rows: [
                { name: '평장묘 석물세트', price: 1200000, note: '3.3㎡' }
            ]
        }
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ park-0093 매장묘 아코디언 제거');

    const supabase = createClient(
        'https://jbydmhfuqnpukfutvrgs.supabase.co',
        'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'
    );
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0093');
    console.log(error ? `❌ ${error.message}` : '🚀 Supabase 완료');
}
fix();
