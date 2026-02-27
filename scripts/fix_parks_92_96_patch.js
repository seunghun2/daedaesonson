const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function fix() {
    const fp = path.join(__dirname, '../data/facilities.json');
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));

    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const updated = [];

    // park-0092: 묘지조화 6,000원 추가
    {
        const p = data.find(d => d.id === 'park-0092');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '서구형 3단', price: 9680000, isRepresentative: true, note: '관리비5년+사용금+조성비+석물 포함 (각자비 별도)' },
                    { name: '서구형 특 3단', price: 10580000, note: '관리비5년+사용금+조성비+석물 포함 (각자비 별도)' },
                    { name: '서구형 특대 3단', price: 11980000, note: '관리비5년+사용금+조성비+석물 포함 (각자비 별도)' },
                    { name: '서구형 특대 합장묘', price: 13580000, note: '관리비5년+사용금+조성비+석물 포함 (각자비 별도)' },
                    { name: '묘지조화', price: 6000, note: '개당' }
                ]
            }
        ];
        updated.push('park-0092');
        console.log('✅ park-0092 보완 (묘지조화 6,000원 추가)');
    }

    // park-0096: 반환정책 행 복원
    {
        const p = data.find(d => d.id === 'park-0096');
        p.priceInfo.standardizedPrices = [
            {
                serviceType: 'BURIAL', subType: '매장묘',
                rows: [
                    { name: '사용료 (최초 30년)', price: 240000, isRepresentative: true },
                    { name: '관리비 (최초 30년)', price: 160000, feeType: 'MAINTENANCE' },
                    { name: '연장 사용료 (5년, 1회 한정)', price: 40000 },
                    { name: '연장 관리비 (5년, 1회 한정)', price: 27000, feeType: 'MAINTENANCE' },
                    { name: '매장 전 사용장소의 반환', price: 0, note: '납부한 금액의 반액' }
                ]
            }
        ];
        updated.push('park-0096');
        console.log('✅ park-0096 보완 (반환정책 행 복원)');
    }

    fs.writeFileSync(fp, JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 facilities.json 저장 완료');

    for (const id of updated) {
        const f = data.find(d => d.id === id);
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', id);
        if (error) {
            console.error(`❌ ${id}: ${error.message}`);
        } else {
            console.log(`🚀 ${id} (${f.name}) → Supabase 완료`);
        }
    }
}

fix();
