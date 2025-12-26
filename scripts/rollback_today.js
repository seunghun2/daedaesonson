const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function rollbackToday() {
    console.log('🔄 오늘 변경사항 롤백 시작...');

    // Supabase 클라이언트
    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // facilities.json 읽기
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));
    const facilityMap = new Map(facilities.map(f => [f.id, f]));

    console.log(`📂 로컬 데이터 로드 완료: ${facilities.length}개`);

    // 롤백 시작 시간 설정 (어제 17:50부터)
    const rollbackFrom = '2025-12-26T17:50:00';  // 어제 5시 57분 이전부터
    console.log(`🔍 ${rollbackFrom} 이후 업데이트된 시설 찾기...`);

    const { data: updatedToday, error } = await supabase
        .from('Facility')
        .select('id, name, updatedAt')
        .gte('updatedAt', rollbackFrom)
        .order('updatedAt', { ascending: false });

    if (error) {
        console.error('❌ Supabase 조회 실패:', error);
        return;
    }

    console.log(`\n📋 오늘 업데이트된 시설: ${updatedToday.length}개`);
    updatedToday.forEach(f => {
        console.log(`  - ${f.id}: ${f.name} (${f.updatedAt})`);
    });

    if (updatedToday.length === 0) {
        console.log('✅ 롤백할 데이터 없음');
        return;
    }

    // 확인
    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const answer = await new Promise(resolve => {
        readline.question(`\n⚠️  ${updatedToday.length}개 시설을 롤백하시겠습니까? (yes/no): `, resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
        console.log('❌ 롤백 취소');
        return;
    }

    // 롤백 실행
    let successCount = 0;
    let failCount = 0;

    for (const dbFacility of updatedToday) {
        const original = facilityMap.get(dbFacility.id);

        if (!original) {
            console.log(`⚠️  ${dbFacility.id}: 원본 데이터 없음 (스킵)`);
            failCount++;
            continue;
        }

        // 복원할 데이터 준비
        const restoreData = {
            id: original.id,
            name: original.name,
            address: original.address,
            category: original.category,
            lat: original.coordinates?.lat,
            lng: original.coordinates?.lng,
            pricing: original.pricing ? JSON.stringify({ priceTable: original.pricing.priceTable }) : null,
            minPrice: original.priceRange?.min || 0,
            maxPrice: original.priceRange?.max || 0,
            updatedAt: original.updatedAt || new Date().toISOString(),
        };

        // undefined 제거
        Object.keys(restoreData).forEach(key => {
            if (restoreData[key] === undefined) delete restoreData[key];
        });

        const { error: updateError } = await supabase
            .from('Facility')
            .update(restoreData)
            .eq('id', original.id);

        if (updateError) {
            console.error(`❌ ${original.id} 롤백 실패:`, updateError.message);
            failCount++;
        } else {
            console.log(`✅ ${original.id} 롤백 완료: ${original.name}`);
            successCount++;
        }
    }

    console.log(`\n📊 롤백 완료`);
    console.log(`   ✅ 성공: ${successCount}`);
    console.log(`   ❌ 실패: ${failCount}`);
}

rollbackToday();
