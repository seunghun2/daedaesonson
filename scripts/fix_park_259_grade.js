const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(x => x.id === 'park-0259');
    const grade = '이용자격: 포천시 6개월이상 거주, 사용기간: 15년(3회 연장가능)';
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '공설묘지 사용료', price: 40000, feeType: 'USAGE', residency: 'LOCAL', grade, isRepresentative: true },
                { name: '공설묘지 관리비', price: 50000, feeType: 'MAINTENANCE', grade },
            ]
        }
    ];
    console.log('✅ park-0259 grade:', grade);

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0259');
    if (error) console.log('❌', error.message);
    else console.log('✨ 완료');
}
fix();
