const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
);

async function main() {
    const data = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));
    const facilities = data.facilities || data;

    // Get --parkId argument if passed
    let targetParkId = null;
    const parkIdArgIndex = process.argv.indexOf('--parkId');
    if (parkIdArgIndex !== -1 && process.argv.length > parkIdArgIndex + 1) {
        targetParkId = process.argv[parkIdArgIndex + 1];
    }

    let updated = 0, errors = 0, skipped = 0;

    for (const f of facilities) {
        if (targetParkId && f.id !== targetParkId) continue;

        const pi = f.priceInfo;
        if (!pi) { skipped++; continue; }

        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(pi) })
            .eq('id', f.id);

        if (error) {
            errors++;
            if (errors <= 3 || targetParkId) console.error(`  ❌ ${f.id}: ${error.message}`);
        } else {
            updated++;
            if (targetParkId) {
                console.log(`✅ ${f.id} 동기화 완료!`);
            } else if (updated % 100 === 0) {
                process.stdout.write(`  ${updated}건 완료...\n`);
            }
        }
    }

    console.log(`\n✅ priceInfo DB 동기화 완료: ${updated}개 성공, ${errors}개 실패, ${skipped}개 스킵`);
}

main().catch(console.error);
