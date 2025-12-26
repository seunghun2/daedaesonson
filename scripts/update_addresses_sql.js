const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function updateAddressesSql() {
    console.log('🔄 SQL UPDATE로 주소만 업데이트 (pricing 보존)');

    const supabaseUrl = 'https://jbydmhfuqnpukfutvrgs.supabase.co';
    const supabaseKey = 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // facilities.json 읽기
    const facilitiesPath = path.join(__dirname, '../data/facilities.json');
    const facilities = JSON.parse(fs.readFileSync(facilitiesPath, 'utf-8'));

    console.log(`📂 로컬 데이터 로드 완료: ${facilities.length}개`);
    console.log('⚠️  SQL UPDATE로 name, address, lat, lng만 업데이트');
    console.log('✅  pricing, minPrice, maxPrice 등은 보존됨');

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

    for (const f of facilities) {
        const { error } = await supabase
            .from('Facility')
            .update({
                name: f.name,
                address: f.address || '',
                category: f.category || 'OTHER',
                lat: f.coordinates?.lat || 0,
                lng: f.coordinates?.lng || 0,
            })
            .eq('id', f.id);

        if (error) {
            console.error(`❌ ${f.id} 실패:`, error.message);
            failCount++;
        } else {
            successCount++;
            if (successCount % 50 === 0) {
                process.stdout.write(`.`);
            }
        }
    }

    console.log(`\n\n📊 업데이트 완료`);
    console.log(`   ✅ 성공: ${successCount}개`);
    console.log(`   ❌ 실패: ${failCount}개`);
}

updateAddressesSql();
