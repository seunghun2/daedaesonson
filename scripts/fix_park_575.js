const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const park = data.find(x => x.id === 'park-0575');
    if (!park) { console.log('NOT FOUND'); return; }

    console.log('=== 수정 전 ===');
    console.log('이름:', park.name);

    const sp = park.priceInfo.standardizedPrices;

    // 1. "선예약" → "우선예약" 이름 변경
    sp.forEach(g => {
        if (g.subType && g.subType.includes('선예약')) {
            g.subType = g.subType.replace('선예약', '우선예약');
        }
    });

    // 2. 우선예약을 위로 (일반보다 먼저 오도록)
    const priority = sp.filter(g => g.subType.includes('우선예약'));
    const normal = sp.filter(g => !g.subType.includes('우선예약'));
    park.priceInfo.standardizedPrices = [...priority, ...normal];

    // 3. ★ 대표 가격 변경: 일반 1단(250만) → 우선예약 1단(200만)
    park.priceInfo.standardizedPrices.forEach(g => {
        g.rows.forEach(r => {
            // 기존 ★ 제거
            if (r.isRepresentative) delete r.isRepresentative;
        });
    });
    // 우선예약 1단에 ★ 설정
    const priorityGroup = park.priceInfo.standardizedPrices.find(g => g.subType.includes('우선예약'));
    if (priorityGroup) {
        const row1 = priorityGroup.rows.find(r => r.name === '1단');
        if (row1) {
            row1.isRepresentative = true;
            console.log('★ 대표가격:', row1.name, row1.price.toLocaleString() + '원');
        }
    }

    // 확인
    console.log('\n=== 수정 후 ===');
    park.priceInfo.standardizedPrices.forEach(g => {
        console.log(`  [${g.serviceType}] ${g.subType}`);
        g.rows.forEach(r => {
            const rep = r.isRepresentative ? ' ★' : '';
            console.log(`    ${r.name} = ${r.price.toLocaleString()}원${rep}`);
        });
    });

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');

    // Supabase 동기화
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
    );

    const { error } = await supabase
        .from('Facility')
        .update({ pricing: JSON.stringify(park.priceInfo) })
        .eq('id', 'park-0575');

    if (error) console.log('❌ Supabase 에러:', error.message);
    else console.log('✅ Supabase 동기화 완료');
}

fix();
