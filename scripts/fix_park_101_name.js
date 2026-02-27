const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(d => d.id === 'park-0101');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘',
            rows: [
                { name: '묘지 사용료 (단장)', price: 1125000, isRepresentative: true, note: '1구당' },
                { name: '묘지 사용료 (합장)', price: 1500000, note: '1구당' },
                { name: '묘지 사용료 (단장, 국가유공자)', price: 0, residency: 'VETERAN', note: '국가유공자 무료' },
                { name: '묘지 사용료 (합장, 국가유공자)', price: 0, residency: 'VETERAN', note: '국가유공자 무료' }
            ]
        },
        {
            serviceType: 'BONGSAN', subType: '봉안묘',
            rows: [
                { name: '봉안묘 사용료', price: 375000, isRepresentative: true, note: '1기당' }
            ]
        }
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ park-0101 이름 통일: 분묘→묘지 사용료');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0101');
    console.log(error ? `❌ ${error.message}` : '🚀 Supabase 동기화 완료');
}
fix();
