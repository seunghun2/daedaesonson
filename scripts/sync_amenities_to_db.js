/**
 * JSON → Supabase DB 편의시설(hasParking, hasRestaurant, hasStore, hasAccessibility) 일괄 동기화
 */
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function main() {
    const facilities = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data', 'facilities.json'), 'utf8'));
    console.log(`총 ${facilities.length}개 시설`);

    let updated = 0;
    let errors = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < facilities.length; i += BATCH_SIZE) {
        const batch = facilities.slice(i, i + BATCH_SIZE);

        const promises = batch.map(f =>
            supabase.from('Facility').update({
                hasParking: !!f.hasParking,
                hasRestaurant: !!f.hasRestaurant,
                hasStore: !!f.hasStore,
                hasAccessibility: !!f.hasAccessibility
            }).eq('id', f.id)
        );

        const results = await Promise.all(promises);

        for (const result of results) {
            if (result.error) {
                errors++;
                if (errors <= 3) console.error('에러:', result.error.message);
            } else {
                updated++;
            }
        }

        process.stdout.write(`\r진행: ${Math.min(i + BATCH_SIZE, facilities.length)} / ${facilities.length}`);
    }

    console.log(`\n\n✅ 완료! ${updated}개 업데이트, ${errors}개 에러`);

    // 검증
    const { data: sample } = await supabase.from('Facility').select('id,hasParking,hasRestaurant,hasStore,hasAccessibility').eq('id', 'park-0001').single();
    console.log('\npark-0001 검증:', sample);
}

main().catch(console.error);
