/**
 * facilities.json의 전체 priceInfo (standardizedPrices 포함)를
 * Supabase DB의 pricing 컬럼에 동기화
 */
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

    let updated = 0, errors = 0, skipped = 0;

    for (const f of facilities) {
        const pi = f.priceInfo;
        if (!pi) { skipped++; continue; }

        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(pi) })
            .eq('id', f.id);

        if (error) {
            errors++;
            if (errors <= 3) console.error(`  ❌ ${f.id}: ${error.message}`);
        } else {
            updated++;
            if (updated % 100 === 0) process.stdout.write(`  ${updated}건 완료...\n`);
        }
    }

    console.log(`\n✅ priceInfo DB 동기화 완료: ${updated}개 성공, ${errors}개 실패, ${skipped}개 스킵`);
}

main().catch(console.error);
