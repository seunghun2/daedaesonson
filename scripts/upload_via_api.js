const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../data/facilities.json');

(async () => {
    console.log('=== 1~10번 시설 Supabase 업로드 (API 사용) ===\n');

    const facilities = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    const top10 = facilities.slice(0, 10);

    let successCount = 0;
    let failCount = 0;

    for (const facility of top10) {
        console.log(`📤 ${facility.name}`);

        try {
            const response = await fetch('http://localhost:3000/api/facilities/upsert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(facility)
            });

            if (response.ok) {
                console.log(`   ✅ 업로드 완료\n`);
                successCount++;
            } else {
                const error = await response.text();
                console.log(`   ❌ 실패: ${error}\n`);
                failCount++;
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
