const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(d => d.id === 'park-0116');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지 사용료 (일반)', price: 180000, isRepresentative: true, residency: 'LOCAL', note: '묘지 1기당 6.61㎡, 사용기간 15년' },
                { name: '묘지 관리비 (일반)', price: 120000, feeType: 'MAINTENANCE', residency: 'LOCAL', note: '연간 관리비' },
                { name: '묘지 사용료 (특례자)', price: 270000, residency: 'LOCAL', note: '여수시 주민등록 1년 미만 거주자, 1기당 6.61㎡' },
                { name: '묘지 관리비 (특례자)', price: 120000, feeType: 'MAINTENANCE', residency: 'LOCAL', note: '연간 관리비' }
            ]
        }
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0116');
    console.log(error ? '❌ ' + error.message : '✅ park-0116 (예다원) 수정 완료');
}
fix();
