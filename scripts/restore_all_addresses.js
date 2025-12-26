const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function restoreAddresses() {
    console.log('🔄 주소 및 좌표 복원 (pricing은 모두 삭제)');

    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // facilities.json 읽기
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));

    console.log(`📂 로컬 데이터 로드 완료: ${facilities.length}개`);
    console.log('⚠️  모든 시설의 name, address, lat, lng를 facilities.json으로 복원하고');
    console.log('⚠️  pricing은 모두 NULL로 초기화합니다.');

    const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
    });

    const answer = await new Promise(resolve => {
        readline.question(`\n계속하시겠습니까? (yes/no): `, resolve);
    });
    readline.close();

    if (answer.toLowerCase() !== 'yes') {
        console.log('❌ 취소');
        return;
    }

    let successCount = 0;
    let failCount = 0;

    const BATCH_SIZE = 50;
    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
        const batch = facilities.slice(i, i + BATCH_SIZE);

        const updateData = batch.map(f => ({
            id: f.id,
            name: f.name,
            address: f.address || '',
            category: f.category || 'OTHER',
            lat: f.coordinates?.lat || 0,
            lng: f.coordinates?.lng || 0,
            minPrice: 0,
            maxPrice: 0,
            updatedAt: new Date().toISOString(),
            pricing: null,  // 모든 pricing 삭제
        }));

        const { error } = await supabase
            .from('Facility')
            .upsert(updateData, { onConflict: 'id' });

        if (error) {
            console.error(`❌ 배치 ${i}~${i + BATCH_SIZE} 실패:`, error.message);
            failCount += batch.length;
        } else {
            successCount += batch.length;
            process.stdout.write('.');
        }
    }

    console.log(`\n\n📊 복원 완료`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);
    console.log(`\n모든 시설의 주소가 원복되고, pricing은 초기화되었습니다.`);
    console.log(`이제 처음부터 pricing 작업을 다시 시작하시면 됩니다.`);
}

restoreAddresses();
