const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const updated = [];

    // park-0102: "현행금액 징수" → "연장 시 동일 요금 적용"
    {
        const p = data.find(d => d.id === 'park-0102');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 200000, isRepresentative: true, note: '1기당 기준면적 6.6㎡' },
                    { name: '묘지 관리비', price: 250000, feeType: 'MAINTENANCE', note: '1기당 기준면적 6.6㎡' },
                    { name: '연장 사용료', price: 200000, note: '연장 시 동일 요금 적용' },
                    { name: '연장 관리비', price: 250000, feeType: 'MAINTENANCE', note: '연장 시 동일 요금 적용' }
                ]
            }
        ];
        updated.push('park-0102');
    }

    // park-0104: "사용금"→"사용료" 통일 + "현행금액 징수"→"연장 시 동일 요금 적용"
    {
        const p = data.find(d => d.id === 'park-0104');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 사용료', price: 200000, isRepresentative: true, note: '1기당 기준면적 6.6㎡' },
                    { name: '묘지 관리비', price: 250000, feeType: 'MAINTENANCE', note: '1기당 기준면적 6.6㎡' },
                    { name: '연장 사용료', price: 200000, note: '연장 시 동일 요금 적용' },
                    { name: '연장 관리비', price: 250000, feeType: 'MAINTENANCE', note: '연장 시 동일 요금 적용' }
                ]
            }
        ];
        updated.push('park-0104');
    }

    // park-0108: note 간결하게
    {
        const p = data.find(d => d.id === 'park-0108');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '묘지 매장비', price: 1650000, isRepresentative: true, note: '1.8평 기준, 매장비·묘비 포함' },
                    { name: '관리비', price: 300000, feeType: 'MAINTENANCE', note: '15년 선납' }
                ]
            },
            {
                serviceType: 'BURIAL', subType: '평장묘',
                rows: [
                    { name: '평장묘 1인용', price: 1000000, isRepresentative: true, note: '15년 관리비 포함' },
                    { name: '평장묘 2인용', price: 1700000, note: '15년 관리비 포함' }
                ]
            }
        ];
        updated.push('park-0108');
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 저장 완료');

    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        console.log(error ? '❌ ' + id + ': ' + error.message : '✅ ' + id + ' (' + f.name + ')');
    }
}
fix();
