const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log('🧹 그룹명 중복 제거 시작...\n');

    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

    let stats = { cleaned: 0 };

    facilities.forEach(f => {
        if (!f.priceInfo?.priceTable) return;

        Object.entries(f.priceInfo.priceTable).forEach(([cat, catData]) => {
            (catData.rows || []).forEach(row => {
                const groupType = row.groupType || '';
                const name = row.name || '';

                // groupType이 있고, name이 groupType으로 시작하면 제거
                if (groupType && name.startsWith(groupType)) {
                    const newName = name.replace(new RegExp('^' + groupType.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*'), '').trim();
                    if (newName && newName !== name) {
                        row.name = newName;
                        stats.cleaned++;
                    }
                }
            });
        });
    });

    console.log(`📊 결과: ${stats.cleaned}개 중복 제거됨`);

    // 저장
    fs.writeFileSync('./data/facilities.json', JSON.stringify(facilities, null, 2));
    console.log('\n💾 로컬 저장 완료');

    // Supabase 동기화
    console.log('\n☁️  Supabase 동기화...');
    let syncCount = 0;

    for (const f of facilities) {
        if (!f.priceInfo) continue;
        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', f.id);
        if (!error) syncCount++;
        if (syncCount % 300 === 0) console.log(`   ⏳ ${syncCount}개...`);
    }

    console.log(`\n🎉 완료! ${syncCount}개 동기화`);
}

main().catch(console.error);
