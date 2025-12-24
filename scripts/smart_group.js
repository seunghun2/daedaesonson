const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 다양한 그룹 패턴 정의
const GROUP_PATTERNS = [
    // 봉안실 패턴 (봉안실, 2봉안실, 5,6봉안실, 3,5,6봉안실)
    { name: '봉안실', regex: /([0-9,]*봉안실)/, extract: m => m[1] },

    { name: '관', regex: /([\uAC00-\uD7AF]*)\s*제?([1-9])\s*관/, extract: m => m[1] ? `${m[1]}${m[2]}관` : `${m[2]}관` },
    { name: '층', regex: /(지하|[1-9])\s*층/, extract: m => m[1] === '지하' ? '지하층' : `${m[1]}층` },
    { name: '실등급', regex: /(일반|특별|고급|프리미엄|로얄|VIP|P|S|A|B)\s*실/, extract: m => `${m[1]}실` },
    { name: '관등급', regex: /(프리미엄|로얄|일반|특별|고급|VIP)\s*관/, extract: m => `${m[1]}관` },
    { name: '동', regex: /([A-Za-z0-9])\s*동(?![작물산])/, extract: m => `${m[1].toUpperCase()}동` },
    { name: '구역', regex: /([A-Za-z0-9가-힣])\s*구역/, extract: m => `${m[1]}구역` },
    { name: '호실대', regex: /(\d)\d{2}호/, extract: m => `${m[1]}00호대` },
    { name: '명칭관', regex: /(하늘|극락|영원|평화|사랑|희망|영생|안식)\s*([1-9])?\s*관/, extract: m => m[2] ? `${m[1]}${m[2]}관` : `${m[1]}관` },

    // 괄호 안 등급 패턴 (고급형, 특별실, 고급 등) - 관내/관외/단장/합장은 제외
    { name: '괄호등급', regex: /\((고급형?|특별실?|일반형?|프리미엄|VIP|기본)\)/, extract: m => m[1] },
];

// 시설별 최적 그룹 패턴 감지
function detectBestPattern(rows) {
    const patternCounts = {};

    rows.forEach(row => {
        const text = `${row.name || ''} ${row.grade || ''} ${row.description || ''}`;

        GROUP_PATTERNS.forEach(pattern => {
            const match = text.match(pattern.regex);
            if (match) {
                const groupName = pattern.extract(match);
                const key = `${pattern.name}:${groupName}`;
                patternCounts[key] = (patternCounts[key] || 0) + 1;
            }
        });
    });

    // 패턴 유형별 집계
    const typeCounts = {};
    Object.keys(patternCounts).forEach(key => {
        const [type] = key.split(':');
        typeCounts[type] = (typeCounts[type] || 0) + patternCounts[key];
    });

    // 가장 많이 등장한 패턴 유형 선택
    const sorted = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0 || sorted[0][1] < 2) return null;

    return GROUP_PATTERNS.find(p => p.name === sorted[0][0]);
}

async function main() {
    console.log('🏢 그룹화 시작 (groupType 필드 사용)...\n');

    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

    let stats = { total: 0, grouped: 0, items: 0 };

    facilities.forEach(f => {
        if (!f.priceInfo?.priceTable?.봉안당) return;

        const bongandang = f.priceInfo.priceTable.봉안당;
        const rows = bongandang.rows || [];

        if (rows.length < 2) return;

        stats.total++;

        // 최적 패턴 감지
        const bestPattern = detectBestPattern(rows);
        if (!bestPattern) return;

        // 그룹 개수 확인
        const groups = {};
        rows.forEach(row => {
            const text = `${row.name || ''} ${row.grade || ''} ${row.description || ''}`;
            const match = text.match(bestPattern.regex);
            if (match) {
                const groupName = bestPattern.extract(match);
                groups[groupName] = true;
            }
        });

        if (Object.keys(groups).length < 2) return;

        // ✅ 올바른 방식: 각 row에 groupType 필드 추가
        const newRows = rows.map(row => {
            const text = `${row.name || ''} ${row.grade || ''} ${row.description || ''}`;
            const match = text.match(bestPattern.regex);

            if (match) {
                const groupName = bestPattern.extract(match);
                return { ...row, groupType: groupName };
            }
            return { ...row, groupType: '미분류' };
        });

        f.priceInfo.priceTable.봉안당.rows = newRows;

        stats.grouped++;
        stats.items += rows.length;
        console.log(`✅ ${f.name}: [${bestPattern.name}] ${Object.keys(groups).join(', ')} (${rows.length}개)`);
    });

    console.log(`\n📊 결과:`);
    console.log(`   전체 봉안당 시설: ${stats.total}개`);
    console.log(`   그룹화 적용: ${stats.grouped}개`);
    console.log(`   아이템 수: ${stats.items}개`);

    fs.writeFileSync('./data/facilities.json', JSON.stringify(facilities, null, 2));
    console.log('\n💾 로컬 저장 완료');

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
