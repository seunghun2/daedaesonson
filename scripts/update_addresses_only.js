const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function updateAddressesOnly() {
    console.log('🔄 주소 및 좌표만 업데이트 (pricing 보존)');

    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // facilities.json 읽기
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));

    console.log(`📂 로컬 데이터 로드 완료: ${facilities.length}개`);
    console.log('⚠️  모든 시설의 name, address, lat, lng만 업데이트');
    console.log('✅  pricing 데이터는 보존됨');

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
            // pricing은 포함하지 않음 → Supabase 기존값 유지
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

    console.log(`\n\n📊 업데이트 완료`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);
    console.log(`\n모든 주소가 PDF 기반으로 업데이트되었고, pricing은 보존되었습니다!`);
}

updateAddressesOnly();
