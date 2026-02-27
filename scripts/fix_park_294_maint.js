const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(x => x.id === 'park-0294');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 90000, feeType: 'USAGE', grade: '1기당 10평방미터', isRepresentative: true },
                { name: '묘지 관리비', price: 25000, feeType: 'MAINTENANCE', grade: '1기당 10평방미터, 유효기간 5년' },
                { name: '묘지 관리비 (영구)', price: 150000, feeType: 'MAINTENANCE', grade: '1기당 10평방미터, 영구 납부' },
            ]
        }
    ];

    console.log('rows:', p.priceInfo.standardizedPrices[0].rows.map(r => r.name + ' = ' + r.price));

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0294');
    if (error) console.log('❌', error.message);
    else console.log('✅ park-0294 관리비(영구) 추가 완료');
}
fix();
