const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// ENV 로더
['.env', '.env.local'].forEach(fileName => {
    const envPath = path.join(__dirname, '../', fileName);
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, 'utf-8');
        envConfig.split('\n').forEach(line => {
            const [key, val] = line.split('=');
            if (key && val && !process.env[key.trim()]) {
                process.env[key.trim()] = val.trim().replace(/^["']|["']$/g, '');
            }
        });
    }
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

(async () => {
    console.log('=== 1~10번 시설 Supabase 업로드 ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const top10 = facilities.slice(0, 10);

    let successCount = 0;
    let failCount = 0;

    for (const facility of top10) {
        console.log(`📤 ${facility.name}`);

        try {
            // 기존 데이터 확인
            const { data: existing } = await supabase
                .from('facilities')
                .select('id')
                .eq('id', facility.id)
                .single();

            if (existing) {
                // 업데이트
                const { error } = await supabase
                    .from('facilities')
                    .update(facility)
                    .eq('id', facility.id);

                if (error) {
                    console.log(`   ❌ 업데이트 실패: ${error.message}\n`);
                    failCount++;
                } else {
                    console.log(`   ✅ 업데이트 완료\n`);
                    successCount++;
                }
            } else {
                // 삽입
                const { error } = await supabase
                    .from('facilities')
                    .insert(facility);

                if (error) {
                    console.log(`   ❌ 삽입 실패: ${error.message}\n`);
                    failCount++;
                } else {
                    console.log(`   ✅ 삽입 완료\n`);
                    successCount++;
                }
            }
        } catch (e) {
            console.log(`   ❌ 에러: ${e.message}\n`);
            failCount++;
        }
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`✅ 성공: ${successCount}개`);
    console.log(`❌ 실패: ${failCount}개`);
    console.log('\n앱에서 확인하세요!');

})();
