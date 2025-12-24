const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 기본 카테고리 정의 (순서 중요!)
const DEFAULT_CATEGORIES = [
    // 매장묘 그룹
    '매장묘', '단장형', '합장형', '쌍분형', '복합묘', '평장묘',
    // 봉안 그룹
    '봉안당', '봉안담', '봉안묘',
    // 수목장 그룹
    '수목형', '잔디형', '화초형', '암석형',
];

async function main() {
    console.log('📦 기본 카테고리 추가 (순서 보장)...\n');

    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

    let stats = { added: 0 };

    facilities.forEach(f => {
        if (!f.priceInfo) {
            f.priceInfo = { priceTable: {} };
        }
        if (!f.priceInfo.priceTable) {
            f.priceInfo.priceTable = {};
        }

        // 기존 데이터 저장
        const oldTable = { ...f.priceInfo.priceTable };

        // 순서대로 새 테이블 생성
        const newTable = {};
        DEFAULT_CATEGORIES.forEach(cat => {
            if (oldTable[cat]) {
                newTable[cat] = oldTable[cat];
                delete oldTable[cat];
            } else {
                newTable[cat] = { rows: [], unit: '' };
                stats.added++;
            }
        });

        // 나머지 카테고리 (기타, 제외됨 등) 추가
        Object.entries(oldTable).forEach(([cat, data]) => {
            newTable[cat] = data;
        });

        f.priceInfo.priceTable = newTable;
    });

    console.log(`📊 결과: ${stats.added}개 카테고리 추가됨`);
    console.log(`   (시설당 평균 ${(stats.added / facilities.length).toFixed(1)}개)`);

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
