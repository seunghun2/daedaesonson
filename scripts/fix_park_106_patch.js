const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');

    const p = data.find(d => d.id === 'park-0106');
    p.priceInfo.standardizedPrices = [
        {
            serviceType: 'BURIAL', subType: '매장묘·봉안묘',
            rows: [
                { name: '매장묘·봉안묘 사용료', price: 1007479, isRepresentative: true, note: '㎡당' },
                { name: '(신규조성) 봉안묘단지 사용료', price: 1641528, note: '㎡당' },
                { name: '연간 관리비', price: 7563, feeType: 'MAINTENANCE', note: '㎡당, 연간' }
            ]
        }
    ];

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('✅ park-0106 수정: 반환규정 삭제, 371번지 문구 제거');

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(p.priceInfo) })
        .eq('id', 'park-0106');
    console.log(error ? `❌ ${error.message}` : '🚀 Supabase 동기화 완료');
}
fix();
