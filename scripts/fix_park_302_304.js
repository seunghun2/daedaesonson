const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    // 302: grade에서 "(16.7.1.부터 변경)" 삭제
    const p302 = data.find(x => x.id === 'park-0302');
    p302.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘원 사용료', price: 3081000, feeType: 'USAGE', grade: '사용료+수수료 포함, 30년 사용', isRepresentative: true },
                { name: '묘원 관리비', price: 300000, feeType: 'MAINTENANCE', grade: '1구당, 30년' },
            ]
        }
    ];

    // 304: grade "m당 연간사용료" → "3.3m²당 연간사용료"
    const p304 = data.find(x => x.id === 'park-0304');
    p304.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘', unit: '원',
            rows: [
                { name: '묘지 사용료', price: 430500, feeType: 'USAGE', grade: '3.3m²당 연간사용료', isRepresentative: true },
                { name: '묘지 관리비', price: 3636, feeType: 'MAINTENANCE', grade: '3.3m²당 연간관리비' },
            ]
        }
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');

    for (const id of ['park-0302', 'park-0304']) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('✅', id);
    }
}
fix();
