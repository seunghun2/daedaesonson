
const fs = require('fs');
const path = require('path');

const JSON_PATH = path.join(__dirname, '../data/facilities.json');

function sortFacilitiesSmartly() {
    console.log('📏 ID 번호 순서대로 다시 스마트하게 줄 세우기...');

    const data = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));

    // 정렬 ( park-0001 -> park-0001-2 -> park-0002 ... )
    data.sort((a, b) => {
        // ID 파싱: park-{number}-{suffix}
        const parseId = (id) => {
            const parts = id.split('-');
            const mainNum = parseInt(parts[1]) || 99999;
            // park-0001 -> suffix: 0
            // park-0001-2 -> suffix: 2
            // park-0558-10 -> suffix: 10
            let suffix = 0;
            if (parts.length > 2) {
                suffix = parseInt(parts[2]) || 0;
                // 만약 park-dup-0001 같은 형태라면? 
                // 현재 데이터 형태: park-0001, park-0001-2, park-0558-10... 등등
                // 그냥 뒤에꺼 숫자로 침 (없으면 0 = 원본)
            }
            return { mainNum, suffix };
        };

        const idA = parseId(a.id);
        const idB = parseId(b.id);

        if (idA.mainNum !== idB.mainNum) {
            return idA.mainNum - idB.mainNum;
        }
        return idA.suffix - idB.suffix;
    });

    const afterIdx = data.findIndex(f => f.id === 'park-1208');
    const lastIdx = data.length - 1;

    console.log(`✨ [재정렬 완료] park-1208 위치: ${afterIdx + 1}번째`);
    console.log(`   첫번째: ${data[0].id}`);
    console.log(`   마지막: ${data[lastIdx].id}`);

    fs.writeFileSync(JSON_PATH, JSON.stringify(data, null, 2));
    console.log('💾 facilities.json 저장 완료!');
}

sortFacilitiesSmartly();
