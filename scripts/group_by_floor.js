const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 그룹 추출 함수 (우선순위대로)
function extractGroup(text) {
    // 1. 관 패턴 (하늘1관, 1관, 제1관)
    const gwan = text.match(/([\uAC00-\uD7AF]*)\s*제?([1-9])\s*관/);
    if (gwan) {
        const prefix = gwan[1] || '';
        return prefix ? `${prefix}${gwan[2]}관` : `${gwan[2]}관`;
    }

    // 2. 층 패턴 (1층, 2층, 지하층)
    const floor = text.match(/(지하|[1-9])\s*층/);
    if (floor) return floor[1] === '지하' ? '지하층' : `${floor[1]}층`;

    // 3. 실 패턴 (A실, B실, 1실)
    const room = text.match(/([A-Za-z가-힣])\s*실/);
    if (room) return `${room[1].toUpperCase()}실`;

    // 4. 동 패턴 (A동, B동, 1동)
    const dong = text.match(/([A-Za-z0-9])\s*동(?![작물산])/);  // 동작, 동물 등 제외
    if (dong) return `${dong[1].toUpperCase()}동`;

    // 5. 구역 패턴 (A구역, 1구역)
    const zone = text.match(/([A-Za-z0-9가-힣])\s*구역/);
    if (zone) return `${zone[1]}구역`;

    // 6. 호실 그룹 (100호대, 200호대)
    const ho = text.match(/(\d)\d{2}호/);
    if (ho) return `${ho[1]}00호대`;

    return null;
}

// 그룹명 정렬 함수
function sortGroups(groups) {
    return groups.sort((a, b) => {
        // 숫자 추출해서 비교
        const aNum = parseInt(a.match(/\d+/)?.[0] || '999');
        const bNum = parseInt(b.match(/\d+/)?.[0] || '999');
        if (aNum !== bNum) return aNum - bNum;
        return a.localeCompare(b, 'ko');
    });
}

async function main() {
    console.log('🏢 위치별 그룹화 시작...\n');

    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

    let groupedCount = 0;
    let facilitiesUpdated = 0;

    facilities.forEach(f => {
        if (!f.priceInfo?.priceTable?.봉안당) return;

        const bongandang = f.priceInfo.priceTable.봉안당;
        const rows = bongandang.rows || [];

        if (rows.length === 0) return;

        // 그룹별로 분류
        const groups = {};
        const noGroup = []; // 그룹 정보 없는 아이템

        rows.forEach(row => {
            const text = `${row.name || ''} ${row.grade || ''} ${row.description || ''}`;
            const group = extractGroup(text);

            if (group) {
                if (!groups[group]) groups[group] = [];
                groups[group].push(row);
            } else {
                noGroup.push(row);
            }
        });

        // 그룹이 2개 이상 있으면 그룹화 적용
        const groupNames = Object.keys(groups);
        if (groupNames.length >= 2) {
            const newRows = [];

            // 그룹 정렬
            const sortedGroups = sortGroups(groupNames);

            sortedGroups.forEach(groupName => {
                // 그룹 헤더 추가
                newRows.push({
                    isGroupHeader: true,
                    groupName: groupName,
                    name: `📍 ${groupName}`,
                    price: '',
                    description: `${groups[groupName].length}개 상품`
                });

                // 해당 그룹의 아이템들 추가
                groups[groupName].forEach(row => {
                    newRows.push({ ...row, group: groupName });
                });
            });

            // 그룹 없는 아이템들
            if (noGroup.length > 0) {
                newRows.push({
                    isGroupHeader: true,
                    groupName: '기타',
                    name: '📍 기타',
                    price: '',
                    description: `${noGroup.length}개 상품`
                });
                noGroup.forEach(row => {
                    newRows.push({ ...row, group: '기타' });
                });
            }

            f.priceInfo.priceTable.봉안당.rows = newRows;
            f.priceInfo.priceTable.봉안당.hasGroups = true;
            f.priceInfo.priceTable.봉안당.groups = [...sortedGroups, ...(noGroup.length > 0 ? ['기타'] : [])];

            facilitiesUpdated++;
            groupedCount += rows.length;
            console.log(`✅ ${f.name}: ${sortedGroups.join(', ')} (${rows.length}개)`);
        }
    });

    console.log(`\n📊 결과:`);
    console.log(`   ${facilitiesUpdated}개 시설 그룹화`);
    console.log(`   ${groupedCount}개 아이템`);

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
        if (syncCount % 200 === 0) console.log(`   ⏳ ${syncCount}개...`);
    }

    console.log(`\n🎉 완료! ${syncCount}개 동기화`);
}

main().catch(console.error);
