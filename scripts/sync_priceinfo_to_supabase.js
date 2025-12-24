const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function syncPricesToSupabase() {
    console.log('🚀 pricing Supabase 동기화 시작...');

    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));
    console.log(`📂 로컬 데이터 로드 완료: ${facilities.length}개`);

    // pricing (JSON 문자열)으로 업데이트
    const BATCH_SIZE = 20;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
        const batch = facilities.slice(i, i + BATCH_SIZE);

        for (const f of batch) {
            if (!f.priceInfo) continue;

            // priceInfo를 JSON 문자열로 변환
            const pricingStr = JSON.stringify(f.priceInfo);

            const { error } = await supabase
                .from('Facility')
                .update({ pricing: pricingStr })
                .eq('id', f.id);

            if (error) {
                console.error(`❌ ${f.id}: ${error.message}`);
                failCount++;
            } else {
                successCount++;
            }
        }

        process.stdout.write(`\r📤 ${Math.min(i + BATCH_SIZE, facilities.length)} / ${facilities.length}`);
    }

    console.log(`\n\n📊 동기화 완료`);
    console.log(`   ✅ 성공: ${successCount}`);
    console.log(`   ❌ 실패: ${failCount}`);
}

syncPricesToSupabase();
