const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const p = data.find(d => d.id === 'park-0098');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지사용금', price: 1000000, isRepresentative: true, note: '평당' },
                { name: '묘지관리비', price: 12000, feeType: 'MAINTENANCE', note: '평당' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안당',
            rows: [
                { name: '봉안당 사용료', price: 1500000, isRepresentative: true, note: '1기/15년' }
            ]
        },
        {
            serviceType: 'BURIAL', subType: '봉안묘',
            rows: [
                { name: '봉안묘 2기형', price: 6000000, isRepresentative: true, note: '유골 2기 안치, 6.6㎡' },
                { name: '봉안묘 2기형 (특)', price: 7000000, note: '유골 2기 안치, 6.6㎡' }
            ]
        }
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ park-0098 봉안묘 → 매장묘지 탭(BURIAL)으로 이동');

    const supabase = createClient(
        'https://jbydmhfuqnpukfutvrgs.supabase.co',
        'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3'
    );
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0098');
    console.log(error ? `❌ ${error.message}` : '🚀 Supabase 완료');
}
fix();
