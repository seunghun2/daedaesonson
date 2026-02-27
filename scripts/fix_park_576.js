const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const park = data.find(x => x.id === 'park-0576');
    if (!park) { console.log('NOT FOUND'); return; }

    const sp = park.priceInfo.standardizedPrices;

    // 1. subType에서 "(1층)" 제거
    sp.forEach(g => {
        if (g.subType) g.subType = g.subType.replace('(1층)', '').trim();
    });

    // 2. 관리비 추가 (싱글단에 MAINTENANCE 행)
    const singleGroup = sp.find(g => g.subType === '싱글단');
    if (singleGroup) {
        const hasMgmt = singleGroup.rows.some(r => r.feeType === 'MAINTENANCE');
        if (!hasMgmt) {
            singleGroup.rows.push({
                name: '관리비(연)', price: 50000, feeType: 'MAINTENANCE',
                grade: '10년 선납기준'
            });
        }
    }

    // 확인
    console.log('=== 수정 후 ===');
    sp.forEach(g => {
        console.log(`  [${g.serviceType}] ${g.subType}`);
        g.rows.forEach(r => {
            const rep = r.isRepresentative ? ' ★' : '';
            const fee = r.feeType ? ` [${r.feeType}]` : '';
            console.log(`    ${r.name} = ${r.price.toLocaleString()}원${fee}${rep}`);
        });
    });

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );
    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(park.priceInfo) })
        .eq('id', 'park-0576');
    if (error) console.log('❌', error.message);
    else console.log('✅ Supabase 동기화 완료');
}
fix();
