const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(x => x.id === 'park-0301');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '평당 묘지 사용료', price: 680000, feeType: 'USAGE', grade: '3.3㎡당', isRepresentative: true },
                { name: '평당 묘지 관리비', price: 15000, feeType: 'MAINTENANCE', grade: '3.3㎡당, 연관리비' },
            ]
        }
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0301');
    if (error) console.log('❌', error.message);
    else console.log('✅ park-0301 "토지대" → "평당 묘지 사용료" 변경 완료');
}
fix();
