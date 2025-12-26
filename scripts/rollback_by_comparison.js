const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function rollbackByComparison() {
    console.log('🔄 facilities.json과 Supabase 비교 롤백 시작...');

    // Supabase 클라이언트
    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // facilities.json 읽기
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));

    console.log(`📂 로컬 데이터 로드 완료: ${facilities.length}개`);

    // facilities.json에서 pricing이 없는 시설들의 ID 목록
    const noLocalPricing = new Set(
        facilities
            .filter(f => !f.pricing || !f.pricing.priceTable)
            .map(f => f.id)
    );

    console.log(`🔍 로컬에 pricing 없는 시설: ${noLocalPricing.size}개`);

    // Supabase에서 pricing이 있는 모든 시설 조회
    const { data: facilitiesWithPricing, error } = await supabase
        .from('Facility')
        .select('id, name, pricing')
        .not('pricing', 'is', null);

    if (error) {
        console.error('❌ Supabase 조회 실패:', error);
        return;
    }

    console.log(`📊 Supabase에 pricing 있는 시설: ${facilitiesWithPricing.length}개`);

    // 잘못된 데이터 찾기: Supabase에만 pricing이 있는 경우
    const wrongPricing = facilitiesWithPricing.filter(f => noLocalPricing.has(f.id));

    console.log(`\n⚠️  롤백 대상 (Supabase에만 pricing 있음): ${wrongPricing.length}개`);
    wrongPricing.forEach(f => {
        console.log(`  - ${f.id}: ${f.name}`);
    });

    if (wrongPricing.length === 0) {
        console.log('✅ 롤백할 데이터 없음');
        return;
    }

    // 확인
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const answer = await new Promise(resolve => {
        readline.question(`\n⚠️  ${wrongPricing.length}개 시설의 pricing을 삭제하시겠습니까? (yes/no): `, resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
        console.log('❌ 롤백 취소');
        return;
    }

    // 롤백 실행
    let successCount = 0;
    let failCount = 0;

    for (const facility of wrongPricing) {
        const { error: updateError } = await supabase
            .from('Facility')
            .update({ pricing: null })
            .eq('id', facility.id);

        if (updateError) {
            console.error(`❌ ${facility.id} 롤백 실패:`, updateError.message);
            failCount++;
        } else {
            console.log(`✅ ${facility.id} pricing 삭제 완료: ${facility.name}`);
            successCount++;
        }
    }

    console.log(`\n📊 롤백 완료`);
    console.log(`   ✅ 성공: ${successCount}`);
    console.log(`   ❌ 실패: ${failCount}`);
}

rollbackByComparison();
