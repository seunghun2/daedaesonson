const fs = require('fs');

const facilities = JSON.parse(fs.readFileSync('data/facilities.json', 'utf8'));

let updated = 0;

facilities.forEach(f => {
    if (!f.priceInfo?.priceTable) return;

    let modified = false;

    Object.values(f.priceInfo.priceTable).forEach(category => {
        if (!category.rows) return;

        category.rows.forEach(row => {
            if (!row.description) return;

            let desc = row.description;
            const original = desc;

            // "이용자격:" 제거
            desc = desc.replace(/이용자격\s*:\s*/g, '');

            // 긴 자격 조건을 간단히
            // "사망 당시 포천시에 주소를 두고 6개월 이상 거주한 자" → "포천시민"
            desc = desc.replace(/사망\s*당시\s*에?\s*주민등록상\s*(\S+?)(시|군|구)에?\s*주소를\s*두고\s*\d+개?월?\s*이상\s*거주한\s*(자|시민)/g, '$1$2민');
            desc = desc.replace(/사망\s*당시\s*(\S+?)(시|군|구)에?\s*주소를\s*두고\s*\d+개?월?\s*이상\s*거주한\s*(자|시민)/g, '$1$2민');

            // "사용기간:15년 3회연장가능" → "15년"
            desc = desc.replace(/사용기간\s*:\s*(\d+년)\s*\d*회?\s*(연장가능|연장\s*가능)?/g, '$1');

            // "사용기간:15년" → "15년"
            desc = desc.replace(/사용기간\s*:\s*/g, '');

            // " 3회연장가능" 같은 잔여 제거
            desc = desc.replace(/\s*\d*회?\s*(연장가능|연장\s*가능)/g, '');

            // 앞뒤 공백/쉼표 정리
            desc = desc.replace(/\s*,\s*/g, ', ').trim();
            desc = desc.replace(/,\s*,/g, ',');

            // "[매장묘] " 같은 prefix 제거
            desc = desc.replace(/^\[.*?\]\s*/g, '');

            if (desc !== original) {
                row.description = desc;
                modified = true;
            }
        });
    });

    if (modified) {
        updated++;
    }
});

// 저장
fs.writeFileSync('data/facilities.json', JSON.stringify(facilities, null, 2), 'utf8');

console.log(`✅ ${updated}개 시설의 이용자격 문구를 간소화했습니다.`);
console.log('\n📋 변환 예시:');
console.log('   이전: "이용자격: 사망 당시 포천시에 주소를 두고 6개월 이상 거주한 자, 사용기간:15년 3회연장가능"');
console.log('   이후: "포천시민, 15년"');
console.log('\n   이전: "이용자격 : 강화군민, 15년"');
console.log('   이후: "강화군민, 15년"');
