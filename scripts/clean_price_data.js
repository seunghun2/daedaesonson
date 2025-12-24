const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// 상품명 정리 함수
function cleanName(name) {
    if (!name) return '';

    let clean = name
        // 괄호 안 내용 정리
        .replace(/\s*\(기본형\)/g, '')
        .replace(/\s*\(신형\)/g, '')
        .replace(/\s*\(구형\)/g, '')
        .replace(/\s*\(일반\)/g, '')
        .replace(/\s*\(표준\)/g, '')
        // 불필요한 수식어 제거
        .replace(/\s*기준$/g, '')
        .replace(/\s*타입$/g, '')
        .replace(/\s*형태$/g, '')
        .replace(/\s*형식$/g, '')
        // 중복 단어 정리
        .replace(/묘지\s*묘지/g, '묘지')
        .replace(/봉안\s*봉안/g, '봉안')
        // "2.5평(8.3㎡)" → "2.5평"
        .replace(/(\d+\.?\d*평)\s*\([^)]+㎡\)/g, '$1')
        // 연속 공백 제거
        .replace(/\s+/g, ' ')
        .trim();

    return clean;
}

// 세부정보 정리 함수
function cleanGrade(grade) {
    if (!grade) return '';

    let clean = grade
        // 핵심 정보만 추출
        .replace(/1평\s*\([^)]+\)\s*기준\s*묘지\s*사용료/g, '1평')
        .replace(/1평당\s*연간\s*관리비/g, '연관리비')
        .replace(/\d+평\s*\([^)]+㎡\)\s*기준\s*\/?\s*/g, '')
        // 불필요한 설명 제거
        .replace(/\s*신설\s*조성/g, '')
        .replace(/\s*묘지\s*사용료/g, '')
        .replace(/\s*공통\s*적용\s*비용/g, '')
        .replace(/\s*기본\s*평장형\s*묘지/g, '')
        .replace(/\s*세트형/g, '')
        // "/ " 정리
        .replace(/\s*\/\s*/g, ' / ')
        .replace(/^\s*\/\s*/g, '')
        .replace(/\s*\/\s*$/g, '')
        // 연속 공백 제거
        .replace(/\s+/g, ' ')
        .trim();

    // 빈 문자열이면 null 반환
    return clean || '';
}

async function main() {
    console.log('🧹 담백하게 정리 시작...\n');

    const facilities = JSON.parse(fs.readFileSync('./data/facilities.json', 'utf-8'));

    let stats = { names: 0, grades: 0 };

    facilities.forEach(f => {
        if (!f.priceInfo?.priceTable) return;

        Object.entries(f.priceInfo.priceTable).forEach(([cat, catData]) => {
            (catData.rows || []).forEach(row => {
                const oldName = row.name || '';
                const oldGrade = row.grade || '';

                const newName = cleanName(oldName);
                const newGrade = cleanGrade(oldGrade);

                if (newName !== oldName) {
                    row.name = newName;
                    stats.names++;
                }
                if (newGrade !== oldGrade) {
                    row.grade = newGrade;
                    stats.grades++;
                }
            });
        });
    });

    console.log(`📊 정리 결과:`);
    console.log(`   상품명: ${stats.names}개 정리됨`);
    console.log(`   세부정보: ${stats.grades}개 정리됨`);

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
