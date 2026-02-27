const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    const supabase = createClient('https://jbydmhfuqnpukfutvrgs.supabase.co', 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3');
    const changed = [];

    // ── 475: 삼척시추모공원 묘지 제2단지 - 석물 별도 아코디언 분리 ──
    const p475 = data.find(x => x.id === 'park-0475');
    if (p475) {
        p475.priceInfo.standardizedPrices = [
            {
                serviceType: 'NATURAL', subType: '잔디형', unit: '원',
                rows: [
                    { name: '단장', price: 410000, feeType: 'USAGE', isRepresentative: true, groupType: '개인', duration: 30, durationType: 'YEAR' },
                    { name: '합장', price: 510000, feeType: 'USAGE', groupType: '부부', duration: 30, durationType: 'YEAR' },
                    { name: '2위 합장', price: 560000, feeType: 'USAGE', groupType: '부부', duration: 30, durationType: 'YEAR' },
                ]
            },
            {
                serviceType: 'NATURAL', subType: '석물', unit: '원',
                rows: [
                    { name: '단장 석물 (비석, 화병, 하단)', price: 407000, feeType: 'USAGE', grade: '국가유공자, 수급자 포함' },
                    { name: '합장 석물 (비석, 화병, 하단)', price: 457000, feeType: 'USAGE', grade: '국가유공자, 수급자 포함' },
                ]
            }
        ];
        console.log('✅ 475 삼척시추모공원 → 석물 별도 아코디언 분리, feeType USAGE');
        changed.push('park-0475');
    }

    // 저장
    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('\n💾 facilities.json 저장 완료');

    // DB 동기화
    for (const id of changed) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) console.log('❌', id, error.message);
        else console.log('✅ DB 동기화:', id);
    }
    console.log('✨ 완료!');
}
fix();
