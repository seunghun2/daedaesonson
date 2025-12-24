const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase 설정 (환경변수 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jbydmhfuqnpukfutvrgs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'sb_secret_CDAM3cyG1RBEmjvSIaHOPA_If4LP8u3';
const supabase = createClient(supabaseUrl, supabaseKey);

// 🎯 분류 규칙 (순서 중요! 더 구체적인 것이 먼저)
const CATEGORY_RULES = [
    // 1. 봉안담 (봉안당보다 먼저!)
    { target: '봉안담', regex: /봉안담/ },

    // 2. 봉안묘
    { target: '봉안묘', regex: /봉안묘|납골묘/ },

    // 3. 봉안당 (단, 층 정보 포함)
    { target: '봉안당', regex: /봉안당|[1-8]단[^장]|층[^리]|실내봉안|납골당/ },

    // 4. 평장묘
    { target: '평장묘', regex: /평장|평분|잔디장[^례]/ },

    // 5. 수목장/자연장
    { target: '수목장', regex: /수목|자연장|나무장|화초장|목련|백합|동백|무궁화|잣나무|소나무|느티/ },

    // 6. 가족형 매장묘 (합장형보다 먼저! "가족형"이 포함되면 가족형으로)
    { target: '가족형', regex: /가족묘|가족형|가족\s*매장|[3-9]기\s*안치|다기/ },

    // 7. 단장형 매장묘 (개별1기)
    { target: '단장형', regex: /단장묘|개인\s*묘|단장\s*묘|(?<![~\-\d])1기(?!\s*이상)/ },

    // 8. 합장형 매장묘 (부부2기, 단 "~2기"는 제외)
    { target: '합장형', regex: /합장묘|부부\s*묘|합장\s*묘|쌍묘|쌍분|(?<![~\-\d])2기(?!\s*이상)/ },

    // 9. 일반 매장묘 (나머지)
    { target: '매장묘', regex: /매장묘|매장\s*묘|분묘|묘지/ },
];

// 1뎁스 매핑 (2뎁스 → 1뎁스)
const DEPTH1_MAP = {
    '단장형': '매장묘',
    '합장형': '매장묘',
    '가족형': '매장묘',
    '평장묘': '매장묘',
    '매장묘': '매장묘',
    '봉안당': '봉안',
    '봉안담': '봉안',
    '봉안묘': '봉안',
    '수목장': '수목장',
};

async function main() {
    console.log('🚀 가격 데이터 자동 분류 및 Supabase 동기화 시작...\n');

    // 1. 로컬 데이터 로드
    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));
    console.log(`📂 ${facilities.length}개 시설 로드됨\n`);

    let totalMoved = 0;
    let stats = {};
    let updatedFacilities = [];

    // 2. 각 시설 처리
    facilities.forEach(f => {
        if (!f.priceInfo?.priceTable) return;

        const oldPriceTable = f.priceInfo.priceTable;
        const newPriceTable = {};
        let facilityMoved = 0;

        Object.entries(oldPriceTable).forEach(([catName, catData]) => {
            const rows = catData.rows || [];

            // 제외됨/기타/옵션은 그대로 유지
            if (['제외됨', '기타', '옵션', '관리비', 'ETC', '화장시설', '부대비용'].includes(catName)) {
                newPriceTable[catName] = catData;
                return;
            }

            rows.forEach(row => {
                const text = `${row.name || ''} ${row.grade || ''} ${row.description || ''}`.toLowerCase();

                let targetCat = null;

                // 규칙에 따라 분류
                for (const rule of CATEGORY_RULES) {
                    if (rule.regex.test(text)) {
                        targetCat = rule.target;
                        break;
                    }
                }

                // 매칭 안되면 원래 카테고리 유지
                if (!targetCat) {
                    targetCat = catName;
                }

                // 새 카테고리에 추가
                if (!newPriceTable[targetCat]) {
                    newPriceTable[targetCat] = { rows: [], unit: catData.unit || '원' };
                }
                newPriceTable[targetCat].rows.push(row);

                // 통계
                if (!stats[targetCat]) stats[targetCat] = 0;
                stats[targetCat]++;

                if (catName !== targetCat) {
                    facilityMoved++;
                    totalMoved++;
                }
            });
        });

        // 업데이트된 priceTable 저장
        f.priceInfo.priceTable = newPriceTable;

        if (facilityMoved > 0) {
            updatedFacilities.push({ id: f.id, name: f.name, moved: facilityMoved });
        }
    });

    console.log(`\n📊 분류 결과:`);
    Object.entries(stats).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
        const depth1 = DEPTH1_MAP[cat] || '기타';
        console.log(`   ${cat} (${depth1}): ${count}개`);
    });

    console.log(`\n✅ 총 ${totalMoved}개 항목 재분류됨`);
    console.log(`📝 ${updatedFacilities.length}개 시설 업데이트됨\n`);

    // 3. 로컬 파일 저장
    fs.writeFileSync('./data/facilities.json', JSON.stringify(facilities, null, 2));
    console.log('💾 로컬 facilities.json 저장 완료\n');

    // 4. Supabase 동기화
    console.log('☁️  Supabase 동기화 시작...');

    let syncCount = 0;
    let errorCount = 0;

    for (const f of facilities) {
        if (!f.priceInfo) continue;

        const { error } = await supabase
            .from('Facility')
            .update({ pricing: JSON.stringify(f.priceInfo) })
            .eq('id', f.id);

        if (error) {
            console.error(`   ❌ ${f.name}: ${error.message}`);
            errorCount++;
        } else {
            syncCount++;
        }

        // 진행률 표시 (100개마다)
        if (syncCount % 100 === 0) {
            console.log(`   ⏳ ${syncCount}개 완료...`);
        }
    }

    console.log(`\n🎉 완료!`);
    console.log(`   ✅ ${syncCount}개 시설 Supabase 동기화 성공`);
    if (errorCount > 0) {
        console.log(`   ❌ ${errorCount}개 오류 발생`);
    }
}

main().catch(console.error);
